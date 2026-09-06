# WHZ — Wellington Hills Zines

A small static website that displays magazines as page-image spreads,
like flipping through the real thing. Click (or tap) the left/right
edges of the open spread to turn pages. Filter the shelf by topic.

## Running it

Use the included server — it does two things: serves the site's
files like any normal local server, and scans the `/magazines`
folder fresh on every request so new magazines show up automatically.

```
cd magazine-reader
python3 serve.py
```

Then open `http://localhost:8000` in your browser. That's it — no
extra setup, no other tools required (just Python 3, which almost
every machine already has).

**If something looks wrong**, you can check exactly what the app
sees by opening `http://localhost:8000/api/magazines.json` directly
in a browser tab — it's plain, readable JSON listing every magazine
it found, so you can immediately tell whether the problem is on the
server side or somewhere else.

You *can* use a different static server (VS Code Live Server, `npx
http-server`, etc.) instead of `serve.py`, but auto-detection won't
work with those — they don't have the `/api/magazines.json`
endpoint. Netlify is the exception: its included build step generates
that file on every deploy (see below).

## Deploying on Netlify

This project is ready for a Git-connected Netlify site. The included
`netlify.toml` runs a small scanner during every deployment and writes
`api/magazines.json` for the website to load.

To publish a new magazine, drop its folder into `magazines/`, then
commit and push the folder to the Git repository connected to Netlify.
Once Netlify finishes the deployment, it appears on the shelf—no edits
to `js/magazines.js` required.

Netlify Drop/manual file uploads do not run build commands, so use a
Git-connected deployment for this automatic workflow.

## Project structure

```
magazine-reader/
├── index.html              shelf view + reader view (one page app)
├── serve.py                 local dev server + magazine auto-scanner
├── css/style.css            all styling
├── js/
│   ├── magazines.js          manual overrides / fallback (usually empty)
│   └── app.js                  reader logic
└── magazines/
    ├── field-notes-01/
    │   ├── meta.json           { "title": ..., "issue": ... }
    │   ├── topic-travel         empty file — tags this topic
    │   └── pages/
    │       ├── page-1.png       front cover
    │       ├── page-2.png
    │       ├── ...
    │       └── page-8.png       back cover
    ├── studio-log-01/          topic: design
    ├── the-long-read-03/       topic: culture
    └── wanderlust-weekly-12/   topics: travel + culture
```

The four included magazines are placeholder content (plain PNGs, not
real scans) so you can see the whole thing — pagination, page-turns,
and topic filtering — working immediately. Swap the page images for
real ones whenever you're ready; same filenames, same folders.

## Adding a new magazine

Just add the files — no config editing needed.

1. Make a folder under `magazines/`, e.g. `magazines/spring-03/`.
2. Inside it, add a `pages/` folder with your page images named
   `page-1.jpg`, `page-2.jpg`, `page-3.jpg`, … in reading order.
   PNG or JPG both work, as long as every page in that magazine
   uses the same one.
   - `page-1` is always treated as the front cover.
   - If the last page ends up alone (odd total page count after
     the cover), it's shown by itself as a back cover, same as
     `page-1`.
3. Refresh the page in your browser. Done — it appears on the
   shelf automatically, titled after the folder name (e.g.
   `spring-03` → "Spring 03").

You can add as many magazines as you like, each with a different
page count — nothing else in the app needs to change.

### Nicer titles: `meta.json`

Drop a `meta.json` file directly inside the magazine's folder
(next to `pages/`, not inside it) to set a proper title and issue
line instead of the folder name:

```
magazines/spring-03/meta.json
magazines/spring-03/pages/page-1.jpg
```

```json
{ "title": "Field Notes", "issue": "Issue 03 — Spring" }
```

To mark a manually configured magazine as an Editor's Pick, add
`editorsPick: true` to its entry in `js/magazines.js`:

```js
{
  id: "spring-03",
  title: "Field Notes",
  editorsPick: true
}
```

Set it to `false` (or remove it) to hide the badge.

### Topics and the shelf filter

To make a magazine show up under a topic filter, add an empty file
next to its `pages/` folder (not inside it) named `topic-` followed
by the topic name:

```
magazines/spring-03/topic-travel
magazines/spring-03/pages/page-1.jpg
```

The file's content doesn't matter — it can be completely empty.
Just its name matters. A magazine can have more than one of these
if it belongs to more than one topic (`topic-travel` and
`topic-culture` side by side, for example).

The filter bar above the shelf is built automatically from whatever
topic files exist across all your magazines — there's no separate
place to "register" a topic. Add a `topic-food` file to any
magazine and a "Food" filter pill appears on its own. Numeric names
like `topic-1` work too and display as "Topic 1".

This repo ships with three example topics already in use — travel,
design, and culture — spread across the four demo magazines so you
can see the filter bar working (Wanderlust Weekly is tagged with
both travel and culture, to show a magazine can belong to more than
one).

(If you'd rather set topics from one place instead of a file per
topic, `meta.json` also accepts a `topics` array: `{ "topics":
["travel", "culture"] }` — combine it with topic files freely.)

### Three-column filters

The filter menu is configured by the `MAGAZINE_FILTERS` array at the
top of `js/magazines.js`. Each object creates one filter column:

```js
{
  key: "format",
  label: "Format",
  values: ["print", "digital"]
}
```

To add a new category:

1. Add an object to `MAGAZINE_FILTERS` with a unique `key`, the label
   shown above the column, and optional starter `values`.
2. Add that same field to magazine entries in `js/magazines.js` or to
   a magazine's `meta.json`.
3. Add every selectable value to the category's `values` array.
4. Refresh the site.

For example, add `"format": "digital"` to `meta.json`:

```json
{
  "publisher": "student",
  "ageRange": "teen",
  "purpose": "newsletter",
  "format": "digital"
}
```

The existing categories are Publisher, Age range, and Purpose. Filter
categories and values are fully controlled by `MAGAZINE_FILTERS`; adding
a value to a magazine alone will not create a new filter option. The
filter panel stays compact and each column scrolls independently when
it has more options than will fit.

## How auto-detection works

`serve.py` is a small Python script (using only the standard
library — no installs) that serves the site's files exactly like
`python3 -m http.server` does, plus one extra route:
`/api/magazines.json`. That route scans `/magazines` on the spot
using plain filesystem calls (not HTML parsing, not guesswork) and
returns each magazine's title, page count, extension, and topics
as JSON. `app.js` fetches that once when the page loads.

Because the scanning happens in Python against real files and
folders, it behaves the same no matter what browser you're using,
and you can always verify it directly by visiting
`/api/magazines.json` yourself.

If you host this somewhere without a Python backend (a plain static
host, for instance), that endpoint won't exist, and the shelf will
fall back to whatever's listed by hand in `js/magazines.js` — that
file still works exactly as it always has, including a `topics`
array, and a manual entry always takes priority over an
auto-detected one with the same `id`.

## How pagination works

`app.js` turns a flat page count into a list of "spreads":

- Spread 0 is always page 1 alone (front cover).
- Then pages are paired up two at a time (2+3, 4+5, 6+7, …).
- If a magazine has an odd number of pages, the very last page is
  left alone, so it reads as a back cover instead of getting stuck
  next to a blank space.

This means a 1-page, 8-page, or 51-page magazine all "just work"
without any per-magazine configuration beyond the page images
themselves.

## Customizing the look

Colors, fonts, and spacing are defined as CSS custom properties at
the top of `css/style.css` (`--paper`, `--ink`, `--accent`, `--gold`,
`--room`, etc.) — change those to re-theme the whole site.

## Reader features

- Use **Bookmark** in the reader header to save magazines in browser
  local storage.
- Reading position is saved automatically and restored when you reopen
  a magazine in the same browser.
- The reader URL includes the magazine ID after `#`, so you can copy
  the **Copy link** button's URL to share a specific magazine.
- On touch devices, swipe left or right across the reader to turn pages.
- The shelf can show only bookmarked zines with **Bookmarked**. Bookmark
  data stays in this browser.
- Finished magazines show a **Read** label so you can see which magazines
  you have completed.
