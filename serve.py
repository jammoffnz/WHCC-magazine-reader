#!/usr/bin/env python3
"""
Local dev server for WHZ (Wellington Hills Zines).

Serves the site exactly like a normal static file server, but adds
one small extra endpoint: /api/magazines.json — which scans the
/magazines folder fresh on every request and returns the current
list of magazines (title, page count, extension, topics) as plain
JSON. That's what lets the shelf pick up a new magazine folder the
moment you refresh the page, with nothing to edit and no build step.

You can sanity-check it directly: with this running, open
    http://localhost:8000/api/magazines.json
in a browser tab and you'll see the exact data the shelf is using.

Run it:
    python3 serve.py [port]
Default port is 8000. It opens your browser to the site automatically —
you don't need to do anything else, just leave this running in its
terminal window and close the tab (or hit Ctrl+C here) when you're done.
"""
import http.server
import json
import os
import re
import sys
import threading
import webbrowser
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
MAGAZINES_DIR = os.path.join(ROOT, "magazines")
MUSIC_DIR = os.path.join(ROOT, "music")
MUSIC_EXTENSIONS = {".mp3", ".ogg", ".wav", ".m4a", ".aac", ".flac"}
PAGE_RE = re.compile(r"^page-(\d+)\.([a-zA-Z0-9]+)$", re.IGNORECASE)
TOPIC_RE = re.compile(r"^topic-(.+)$", re.IGNORECASE)


def title_case(s):
    words = re.split(r"[-_]+", s.strip())
    return " ".join(w.capitalize() for w in words if w)


def scan_magazine(folder_name):
    folder_path = os.path.join(MAGAZINES_DIR, folder_name)
    pages_path = os.path.join(folder_path, "pages")
    if not os.path.isdir(pages_path):
        return None

    pages = []
    for fname in os.listdir(pages_path):
        m = PAGE_RE.match(fname)
        if m:
            pages.append((int(m.group(1)), m.group(2)))
    if not pages:
        return None
    pages.sort(key=lambda p: p[0])
    extension = pages[0][1]
    page_count = len(pages)

    meta = {}
    meta_path = os.path.join(folder_path, "meta.json")
    if os.path.isfile(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
        except (OSError, ValueError):
            meta = {}

    topics = set()
    for entry in os.listdir(folder_path):
        m = TOPIC_RE.match(entry)
        if m:
            slug = re.sub(r"\.[a-zA-Z0-9]{1,6}$", "", m.group(1))
            topics.add(slug.lower())
    for t in meta.get("topics", []):
        topics.add(str(t).lower())

    return {
        **meta,
        "id": folder_name,
        "title": meta.get("title") or title_case(folder_name),
        "issue": meta.get("issue") or "",
        "folder": f"magazines/{folder_name}/pages",
        "pageCount": page_count,
        "extension": extension,
        "topics": sorted(topics),
        "publisher": meta.get("publisher", ""),
        "ageRange": meta.get("ageRange", ""),
        "purpose": meta.get("purpose", ""),
    }


def scan_all_magazines():
    if not os.path.isdir(MAGAZINES_DIR):
        return []
    results = []
    for name in sorted(os.listdir(MAGAZINES_DIR)):
        if os.path.isdir(os.path.join(MAGAZINES_DIR, name)):
            mag = scan_magazine(name)
            if mag:
                results.append(mag)
    return results


def scan_music():
    if not os.path.isdir(MUSIC_DIR):
        return []
    tracks = []
    for name in sorted(os.listdir(MUSIC_DIR)):
        path = os.path.join(MUSIC_DIR, name)
        if os.path.isfile(path) and os.path.splitext(name)[1].lower() in MUSIC_EXTENSIONS:
            tracks.append({
                "title": os.path.splitext(name)[0].replace("-", " ").replace("_", " ").title(),
                "src": f"music/{name}",
            })
    return tracks


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlparse(self.path).path == "/api/magazines.json":
            body = json.dumps(scan_all_magazines()).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        if urlparse(self.path).path == "/api/music.json":
            body = json.dumps(scan_music()).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def log_message(self, fmt, *args):
        # quieter console output — these endpoints are polled on every page
        # load, so their requests would otherwise flood the terminal
        # HTTPStatus renders as "HTTPStatus.NOT_FOUND" on older Pythons —
        # take its numeric value instead, which is what "%d" wanted anyway.
        args = tuple(str(getattr(a, "value", a)) for a in args)
        if "/api/magazines.json" in " ".join(args):
            return
        # The stdlib logs errors as ("code %d, message %s", HTTPStatus, msg).
        # An HTTPStatus isn't a number, so re-format that %d as %s — otherwise
        # the TypeError raised here escapes send_error(), and a plain missing
        # file comes back as a dropped connection instead of a normal 404.
        super().log_message(fmt.replace("%d", "%s"), *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    os.chdir(ROOT)
    url = f"http://localhost:{port}"
    try:
        httpd = http.server.ThreadingHTTPServer(("", port), Handler)
    except OSError:
        print(f"Couldn't start on port {port} — it's already in use.")
        print("Either close whatever's already running (an earlier serve.py?),")
        print(f"or pick a different port: python3 serve.py {port + 1}")
        sys.exit(1)

    with httpd:
        print(f"WHZ is running at {url}")
        print(f"  (magazine list check: {url}/api/magazines.json)")
        print("Opening it in your browser now — leave this window open.")
        print("Press Ctrl+C here to stop the server.")
        # Give the server a beat to start accepting connections before the
        # browser tries to load the page, then open it automatically.
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
