/**
 * MAGAZINE READER
 * ------------------------------------------------------------
 * Magazines are found two ways, combined together:
 *
 *   1. AUTO-DETECTED — on load, the app asks the local dev server
 *      (serve.py) for /api/magazines.json, which is a fresh scan
 *      of the /magazines folder done in Python. Drop a folder in,
 *      refresh the page, it's there — nothing to edit.
 *
 *   2. MANUAL — anything listed in js/magazines.js. Useful as a
 *      fallback if you're not using serve.py (e.g. a plain static
 *      host with no server-side code), or to pin a custom title.
 *      A manual entry always wins over an auto-detected one with
 *      the same id.
 * ------------------------------------------------------------
 */

(function () {
  "use strict";

  const shelfView = document.getElementById("shelf-view");
  const shelfGrid = document.getElementById("shelf-grid");
  const shelfHeading = document.getElementById("shelf-heading");
  const topicDropdown = document.getElementById("topic-dropdown");
  const topicDropdownToggle = document.getElementById("topic-dropdown-toggle");
  const topicDropdownLabel = document.getElementById("topic-dropdown-label");
  const topicDropdownPanel = document.getElementById("topic-dropdown-panel");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const bookmarksFilter = document.getElementById("bookmarks-filter");
  const shelfSecondaryControls = document.querySelector(".shelf-secondary-controls");
  const isRetroPage = document.body.classList.contains("retro-page");
  const themeToggle = document.getElementById("theme-toggle");
  const mediaToggle = document.getElementById("media-toggle");
  const mediaPanel = document.getElementById("media-panel");
  const musicAudio = document.getElementById("music-audio");
  const musicPlay = document.getElementById("music-play");
  const musicPrev = document.getElementById("music-prev");
  const musicNext = document.getElementById("music-next");
  const musicProgress = document.getElementById("music-progress");
  const musicTime = document.getElementById("music-time");
  const musicStatus = document.getElementById("music-status");
  const soundToggle = document.getElementById("sound-toggle");
  const readerView = document.getElementById("reader-view");
  const backBtn = document.getElementById("back-btn");
  const titleMain = document.getElementById("reader-title-main");
  const titleIssue = document.getElementById("reader-title-issue");
  const readerPublisher = document.getElementById("reader-publisher");
  const progressEl = document.getElementById("reader-progress");
  const progressBar = document.getElementById("reader-progress-bar");
  const bookmarkBtn = document.getElementById("bookmark-btn");
  const shareBtn = document.getElementById("share-btn");
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const readStatusBtn = document.getElementById("read-status-btn");
  const book = document.getElementById("book");
  const spreadEl = document.getElementById("spread");
  const imgLeft = document.getElementById("img-left");
  const imgRight = document.getElementById("img-right");
  const turnSheet = document.getElementById("turn-sheet");
  const turnFrontImg = document.getElementById("turn-front-img");
  const turnBackImg = document.getElementById("turn-back-img");
  const zonePrev = document.getElementById("zone-prev");
  const zoneNext = document.getElementById("zone-next");
  const dotsEl = document.getElementById("dots");
  const mobileNotice = document.getElementById("mobile-notice");
  const mobileNoticeDismiss = document.getElementById("mobile-notice-dismiss");

  let LIBRARY = [];
  let activeFilters;
  let sortOrder = "latest";
  let showBookmarkedOnly = false;
  let searchQuery = "";
  let currentMagazine = null;
  let spreads = [];
  let spreadIndex = 0;
  let isAnimating = false;
  let touchStartX = null;
  const preloadedPages = new Map();
  let audioContext = null;
  let musicTimer = null;
  let musicGain = null;
  let musicTracks = [];
  let musicTrackIndex = 0;

  const TURN_MS = 720; // must match .turn-sheet transition duration in style.css
  const COVER_TURN_MS = 520; // must match .spread cover-change animation duration in style.css
  const NEW_MAGAZINE_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;
  const BOOKMARKS_KEY = "whz-bookmarks";
  const PROGRESS_KEY = "whz-reading-progress";
  const READ_STATUS_KEY = "whz-read-status";

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext ||= new AudioContextClass();
    return audioContext;
  }

  function scheduleUiSound(context, kind) {
    const now = context.currentTime;
    const tone = (frequency, duration, volume, type = "sine", start = now) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    };
    const noise = (duration, volume, filterFrequency, start = now) => {
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = filterFrequency;
      filter.Q.value = 0.8;
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      source.connect(filter).connect(gain).connect(context.destination);
      source.start(start);
      source.stop(start + duration);
    };

    if (kind === "page-flip") {
      const duration = 0.42;
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        const progress = i / data.length;
        data[i] = (Math.random() * 2 - 1) * Math.sin(progress * Math.PI);
      }
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + duration * 0.55);
      filter.frequency.exponentialRampToValueAtTime(900, now + duration);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.14, now + duration * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      source.connect(filter).connect(gain).connect(context.destination);
      source.start(now);
      source.stop(now + duration);
      tone(210, 0.3, 0.035, "sine");
      return;
    }
    if (kind === "zine-select") {
      tone(520, 0.1, 0.1, "sine");
      tone(780, 0.15, 0.08, "sine", now + 0.06);
      return;
    }
    noise(0.045, 0.28, 700);
    tone(125, 0.07, 0.14, "triangle");
  }

  function playUiSound(kind = "button") {
    if (!soundToggle.checked) return;
    const context = getAudioContext();
    if (!context) return;
    if (context.state === "suspended") {
      context.resume()
        .then(() => scheduleUiSound(context, kind))
        .catch((error) => console.warn("Unable to resume sound effects:", error));
      return;
    }
    scheduleUiSound(context, kind);
  }

  function updateFullscreenButton() {
    const active = document.fullscreenElement === readerView;
    fullscreenBtn.textContent = active ? "Exit fullscreen" : "Fullscreen";
    fullscreenBtn.setAttribute("aria-pressed", String(active));
  }

  function positionMediaPanel() {
    if (mediaPanel.hidden) return;
    const buttonRect = mediaToggle.getBoundingClientRect();
    mediaPanel.style.top = `${buttonRect.bottom + 0.5 * parseFloat(getComputedStyle(document.documentElement).fontSize)}px`;
    mediaPanel.style.right = `${Math.max(1, window.innerWidth - buttonRect.right)}px`;
  }

  function playMusicLoop() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    musicGain = audioContext.createGain();
    musicGain.gain.value = 0.055;
    musicGain.connect(audioContext.destination);
    const notes = [
      [261.63, 329.63, 392.0, 493.88],
      [220.0, 277.18, 329.63, 440.0],
      [174.61, 220.0, 261.63, 349.23],
      [196.0, 246.94, 293.66, 392.0]
    ];
    let step = 0;
    const playChord = () => {
      const start = audioContext.currentTime;
      notes[step % notes.length].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.32 / (index + 2), start + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 2.8);
        oscillator.connect(gain).connect(musicGain);
        oscillator.start(start);
        oscillator.stop(start + 3);
      });
      step += 1;
    };
    playChord();
    musicTimer = window.setInterval(playChord, 2800);
  }

  function stopMusicLoop() {
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = null;
    if (musicGain) musicGain.disconnect();
    musicGain = null;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  async function loadMusicTracks() {
    try {
      const response = await fetch("api/music.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Music request failed: ${response.status}`);
      musicTracks = await response.json();
    } catch {
      try {
        const response = await fetch("music/music.json", { cache: "no-store" });
        if (!response.ok) throw new Error(`Music manifest failed: ${response.status}`);
        musicTracks = await response.json();
      } catch {
        musicTracks = [];
      }
    }
    if (musicTracks.length) {
      musicTrackIndex = 0;
      musicAudio.src = musicTracks[0].src;
      musicStatus.textContent = musicTracks[0].title;
    }
  }

  function setMusicTrack(index, shouldPlay = false) {
    if (!musicTracks.length) return false;
    musicTrackIndex = (index + musicTracks.length) % musicTracks.length;
    const track = musicTracks[musicTrackIndex];
    musicAudio.src = track.src;
    musicStatus.textContent = track.title;
    musicProgress.value = "0";
    if (shouldPlay) {
      musicAudio.play().catch(() => {
        musicStatus.textContent = "Unable to play this track";
      });
      musicPlay.textContent = "Stop music";
    }
    return true;
  }

  function isBookmarked(id) {
    return readStorage(BOOKMARKS_KEY, []).includes(id);
  }
  function isRead(id) {
    return readStorage(READ_STATUS_KEY, []).includes(id);
  }

  function updateReadStatusButton() {
    const read = isRead(currentMagazine.id);
    readStatusBtn.hidden = !read;
    readStatusBtn.textContent = read ? "Mark as unread" : "Mark as read";
  }

  function updateBookmarkButton() {
    const bookmarked = isBookmarked(currentMagazine.id);
    bookmarkBtn.textContent = bookmarked ? "★ Bookmarked" : "☆ Bookmark";
    bookmarkBtn.setAttribute("aria-pressed", String(bookmarked));
  }

  function updateUrl(id) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
  }

  /* ---------- helpers ---------- */

  function pagePath(mag, pageNum) {
    return `${mag.folder}/page-${pageNum}.${mag.extension}`;
  }

  function preloadPage(pageNum) {
    const src = pagePath(currentMagazine, pageNum);
    if (preloadedPages.has(src)) return preloadedPages.get(src);

    const loaded = new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = src;
      if (image.complete) resolve();
    });
    preloadedPages.set(src, loaded);
    return loaded;
  }

  function preloadSpread(index) {
    const spread = spreads[index];
    return spread ? Promise.all(spread.pages.map(preloadPage)) : Promise.resolve();
  }

  async function loadIntoPage(image, pageNum) {
    const src = pagePath(currentMagazine, pageNum);
    if (image.getAttribute("src") !== src) {
      image.src = src;
    }
    if (!image.complete) {
      await new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }
  }

  function titleCase(str) {
    return str
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // "1" -> "Topic 1", "travel" -> "Travel"
  function topicLabel(slug) {
    return /^\d+$/.test(slug) ? `Topic ${slug}` : titleCase(slug);
  }

  function publisherUrl(name) {
    return typeof PUBLISHER_WEBSITES !== "undefined" && PUBLISHER_WEBSITES[name]
      ? PUBLISHER_WEBSITES[name]
      : "";
  }

  function isNewMagazine(mag) {
    if (!mag.dateAdded) return false;

    const addedAt = new Date(`${mag.dateAdded}T00:00:00`);
    if (Number.isNaN(addedAt.getTime())) return false;

    const age = Date.now() - addedAt.getTime();
    return age >= 0 && age <= NEW_MAGAZINE_WINDOW_MS;
  }

  // Pinned zines are promoted to the top of the shelf, directly beneath the
  // ad. Ads are excluded — they already sort first and carry no badges.
  function isPinned(mag) {
    return mag.pinned === true && !mag.adUrl;
  }

  // Build the sequence of spreads for a magazine: page 1 is a standalone
  // front cover, the final page (if it lands alone) is a standalone back
  // cover, and everything between is paired into two-page spreads.
  function buildSpreads(pageCount) {
    const result = [{ type: "single", pages: [1] }];
    let i = 2;
    while (i <= pageCount) {
      if (i === pageCount) {
        result.push({ type: "single", pages: [i] });
        i += 1;
      } else {
        result.push({ type: "pair", pages: [i, i + 1] });
        i += 2;
      }
    }
    return result;
  }

  /* ---------- library ---------- */

  // Ask serve.py's /api/magazines.json for a fresh scan of /magazines.
  // Returns [] (never throws) if it's missing or the server doesn't
  // support it, so buildLibrary() can fall back to the manual list.
  async function discoverMagazines() {
    try {
      const res = await fetch("api/magazines.json", { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  async function buildLibrary() {
    const manual =
      typeof MAGAZINE_LIBRARY !== "undefined" && Array.isArray(MAGAZINE_LIBRARY) ? MAGAZINE_LIBRARY : [];
    const discovered = await discoverMagazines();

    const combined = [...manual];
    const knownIds = new Set(manual.map((m) => m.id));
    discovered.forEach((mag) => {
      if (!knownIds.has(mag.id)) {
        combined.push(mag);
        knownIds.add(mag.id);
      }
    });
    return combined;
  }

  /* ---------- category filters ---------- */

  const FILTERS =
    typeof MAGAZINE_FILTERS !== "undefined" && Array.isArray(MAGAZINE_FILTERS) ? MAGAZINE_FILTERS : [];
  activeFilters = Object.fromEntries(FILTERS.map((filter) => [filter.key, "all"]));

  function filterValues(filter) {
    return [...filter.values].sort((a, b) => a.localeCompare(b));
  }

  function magazineMatchesFilter(mag, key, value) {
    if (value === "all") return true;
    const values = Array.isArray(mag[key]) ? mag[key] : [mag[key]];
    return values.filter(Boolean).some((item) => String(item).toLowerCase() === value.toLowerCase());
  }

  function renderTopicFilters() {
    topicDropdown.hidden = false;
    topicDropdownPanel.innerHTML = "";

    const makeOption = (filter, label, value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "topic-pill";
      btn.textContent = label;
      btn.setAttribute("aria-pressed", String(activeFilters[filter.key] === value));
      btn.classList.toggle("is-active", activeFilters[filter.key] === value);
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        activeFilters[filter.key] = value;
        renderTopicFilters();
        renderShelf();
      });
      return btn;
    };

    const columns = document.createElement("div");
    columns.className = "filter-columns";
    FILTERS.forEach((filter) => {
      const column = document.createElement("section");
      column.className = "filter-column";
      const heading = document.createElement("h2");
      heading.textContent = filter.label;
      column.appendChild(heading);
      column.appendChild(makeOption(filter, `All ${filter.label.toLowerCase()}`, "all"));
      filterValues(filter).forEach((value) => column.appendChild(makeOption(filter, titleCase(value), value)));
      columns.appendChild(column);
    });
    topicDropdownPanel.appendChild(columns);
    if (shelfSecondaryControls) {
      topicDropdownPanel.appendChild(shelfSecondaryControls);
    }

    const activeCount = Object.values(activeFilters).filter((value) => value !== "all").length;
    topicDropdownLabel.textContent = activeCount ? `Filters (${activeCount})` : "Filter zines";
    if (activeCount) {
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "clear-filters";
      clear.textContent = "Clear filters";
      clear.addEventListener("click", (event) => {
        event.stopPropagation();
        activeFilters = Object.fromEntries(FILTERS.map((item) => [item.key, "all"]));
        renderTopicFilters();
        renderShelf();
      });
      topicDropdownPanel.appendChild(clear);
    }
  }

  function positionTopicDropdown() {
    if (isRetroPage) return;
    if (topicDropdownPanel.hidden) return;
    const buttonRect = topicDropdownToggle.getBoundingClientRect();
    topicDropdownPanel.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
  }

  function updateRetroHeaderOffset() {
    if (!isRetroPage) return;
    const header = document.querySelector(".shelf-header");
    const controls = document.querySelector(".shelf-controls");
    if (header) {
      const headerHeight = header.getBoundingClientRect().height;
      const controlsHeight = controls ? controls.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty("--retro-header-height", `${headerHeight}px`);
      document.documentElement.style.setProperty("--retro-controls-height", `${controlsHeight}px`);
      document.documentElement.style.setProperty(
        "--retro-shell-height",
        `${headerHeight + controlsHeight}px`
      );
    }
  }

  function updateRetroReaderOffset() {
    if (!isRetroPage || readerView.hidden) return;
    const header = readerView.querySelector(".reader-header");
    if (header) {
      document.documentElement.style.setProperty(
        "--retro-reader-header-height",
        `${header.getBoundingClientRect().height}px`
      );
    }
  }

  function openTopicDropdown() {
    topicDropdownPanel.hidden = false;
    positionTopicDropdown();
    topicDropdownToggle.setAttribute("aria-expanded", "true");
  }
  function closeTopicDropdown() {
    topicDropdownPanel.hidden = true;
    topicDropdownPanel.style.left = "";
    topicDropdownToggle.setAttribute("aria-expanded", "false");
  }
  function toggleTopicDropdown() {
    if (topicDropdownPanel.hidden) openTopicDropdown();
    else closeTopicDropdown();
  }

  /* ---------- shelf ---------- */

  function renderShelf() {
    shelfGrid.innerHTML = "";

    const query = searchQuery.trim().toLowerCase();
    const visible = LIBRARY.filter((m) => {
      const matchesFilters = FILTERS.every((filter) => magazineMatchesFilter(m, filter.key, activeFilters[filter.key]));
      const matchesSearch =
        !query ||
        m.title.toLowerCase().includes(query) ||
        (m.issue || "").toLowerCase().includes(query);
      return matchesFilters && matchesSearch && (!showBookmarkedOnly || isBookmarked(m.id));
    });
    visible.sort((a, b) => {
      // Sponsored cards sit at the very top, then pinned zines immediately
      // beneath them — pinning is how something gets promoted to the front
      // of the shelf. Bookmarked / unread / sort-order rules follow as before.
      const adDifference = Number(!!b.adUrl) - Number(!!a.adUrl);
      if (adDifference !== 0) return adDifference;
      const pinnedDifference = Number(isPinned(b)) - Number(isPinned(a));
      if (pinnedDifference !== 0) return pinnedDifference;
      const bookmarkDifference = Number(isBookmarked(b.id)) - Number(isBookmarked(a.id));
      if (bookmarkDifference !== 0) return bookmarkDifference;
      const readDifference = Number(isRead(a.id)) - Number(isRead(b.id));
      if (readDifference !== 0) return readDifference;
      if (sortOrder === "alphabetical") return a.title.localeCompare(b.title);
      const aDate = Date.parse(a.dateAdded || "");
      const bDate = Date.parse(b.dateAdded || "");
      const aTime = Number.isNaN(aDate) ? 0 : aDate;
      const bTime = Number.isNaN(bDate) ? 0 : bDate;
      return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
    });

    if (visible.length === 0) {
      const p = document.createElement("p");
      p.className = "shelf-empty";
      p.textContent =
        LIBRARY.length === 0
          ? "No magazines found. Add a folder under /magazines/ with a /pages/ subfolder of page-1, page-2, ... images, then refresh."
          : "Nothing matches that search or filter.";
      shelfGrid.appendChild(p);
      return;
    }

    visible.forEach((mag) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "cover-card";
      card.classList.toggle("is-read", isRead(mag.id));
      // Ads are always straight — no random tilt
      if (mag.adUrl) {
        card.classList.add("is-ad");
      } else {
        // Random tilt each render, so covers don't fall into a visible pattern.
        const tilt = (Math.random() * 5 - 2.5).toFixed(2);
        card.style.setProperty("--tilt", `${tilt}deg`);
      }
      card.addEventListener("click", () => {
        playUiSound("zine-select");
        if (mag.adUrl) {
          window.open(mag.adUrl, "_blank", "noopener noreferrer");
        } else {
          openMagazine(mag.id);
        }
      });

      const thumb = document.createElement("div");
      thumb.className = "cover-thumb";
      const img = document.createElement("img");
      img.src = pagePath(mag, 1);
      img.alt = `${mag.title} cover`;
      img.addEventListener("error", () => {
        img.remove();
        const fallback = document.createElement("span");
        fallback.className = "cover-fallback";
        fallback.textContent = "Cover unavailable";
        fallback.setAttribute("aria-label", `${mag.title} cover unavailable`);
        thumb.appendChild(fallback);
      }, { once: true });
      thumb.appendChild(img);
      const badges = document.createElement("div");
      badges.className = "cover-badges";
      if (isPinned(mag)) {
       const badge = document.createElement("span");
       badge.className = "pinned-badge";
       badge.textContent = "Pinned";
       badge.setAttribute("aria-label", "Pinned to the top of the shelf");
       badges.appendChild(badge);
      }
      if (mag.editorsPick === true && !mag.adUrl) {
       const badge = document.createElement("span");
       badge.className = "editors-pick-badge";
       badge.textContent = "Editor's pick";
       badge.setAttribute("aria-label", "Editor's pick");
       badges.appendChild(badge);
      }
      if (isNewMagazine(mag) && !mag.adUrl) {
       const badge = document.createElement("span");
       badge.className = "new-badge";
       badge.textContent = "New";
       badge.setAttribute("aria-label", "Published within the past 5 days");
       badges.appendChild(badge);
      }
      // Tags are appended above the cover (see the card appends below) rather
      // than over it, so a badge never sits on top of the artwork or a
      // masthead logo.

      const caption = document.createElement("div");
      caption.className = "cover-caption";
      if (mag.adUrl) {
       caption.textContent = "Check out " + (mag.publisher || "this site") + " here!";
      } else {
       caption.textContent = mag.title;
      }

      // Publisher row — shown as a clickable link if we have a URL
      if (mag.publisher) {
        const pubLink = document.createElement("a");
        pubLink.className = "cover-publisher";
        pubLink.textContent = mag.publisher;
        const url = publisherUrl(mag.publisher);
        if (url) {
          pubLink.href = url;
          pubLink.target = "_blank";
          pubLink.rel = "noopener noreferrer";
          pubLink.title = `Visit ${mag.publisher} website`;
        }
        // Stop clicks on the publisher link from opening the magazine
        pubLink.addEventListener("click", (e) => e.stopPropagation());
        caption.appendChild(pubLink);
      }

      if (!mag.adUrl) {
       const small = document.createElement("small");
       small.textContent = mag.issue
         ? `${mag.issue} · ${mag.pageCount} pages`
         : `${mag.pageCount} pages`;
       caption.appendChild(small);
       if (isBookmarked(mag.id)) {
         const saved = document.createElement("small");
         saved.className = "bookmark-label";
         saved.textContent = "Bookmarked";
         caption.appendChild(saved);
       }
       if (isRead(mag.id)) {
         const read = document.createElement("small");
         read.className = "read-label";
         read.textContent = "Read";
         caption.appendChild(read);
       }
      }

      card.appendChild(badges);
      card.appendChild(thumb);
      card.appendChild(caption);
      shelfGrid.appendChild(card);
    });
  }

  /* ---------- reader ---------- */

  function openMagazine(id) {
    const mag = LIBRARY.find((m) => m.id === id);
    if (!mag) return;

    // Ads don't open in the reader — go straight to the external URL
    if (mag.adUrl) {
      window.open(mag.adUrl, "_blank", "noopener noreferrer");
      return;
    }

    currentMagazine = mag;
    spreads = buildSpreads(mag.pageCount);
    const savedProgress = readStorage(PROGRESS_KEY, {})[id];
    spreadIndex = Number.isInteger(savedProgress) && savedProgress >= 0 && savedProgress < spreads.length ? savedProgress : 0;

    titleMain.textContent = mag.title;
    titleIssue.textContent = mag.issue;
    if (mag.publisher) {
      const url = publisherUrl(mag.publisher);
      if (url) {
        readerPublisher.innerHTML = `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer" title="Visit ${mag.publisher} website">${mag.publisher}</a>`;
      } else {
        readerPublisher.textContent = mag.publisher;
      }
      readerPublisher.hidden = false;
    } else {
      readerPublisher.hidden = true;
    }
    updateBookmarkButton();
    updateReadStatusButton();
    updateUrl(id);

    renderDots();
    renderSpread();

    shelfView.hidden = true;
    readerView.hidden = false;
    updateRetroReaderOffset();
  }

  function closeMagazine() {
    readerView.hidden = true;
    shelfView.hidden = false;
    currentMagazine = null;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function renderDots() {
    dotsEl.innerHTML = "";
    spreads.forEach(() => {
      const d = document.createElement("span");
      d.className = "dot";
      dotsEl.appendChild(d);
    });
  }

  function updateDots() {
    [...dotsEl.children].forEach((d, i) => {
      d.classList.toggle("is-current", i === spreadIndex);
    });
  }

  function updateProgress() {
    const s = spreads[spreadIndex];
    const total = currentMagazine.pageCount;
    let label;
    if (spreadIndex === 0) {
      label = "Cover";
    } else if (s.type === "single") {
      label = "Back cover";
    } else {
      label = `${s.pages[0]}–${s.pages[1]} of ${total}`;
    }
    progressEl.textContent = label;
    const percent = spreads.length <= 1 ? 100 : Math.round((spreadIndex / (spreads.length - 1)) * 100);
    progressBar.style.width = `${percent}%`;
    const progress = readStorage(PROGRESS_KEY, {});
    progress[currentMagazine.id] = spreadIndex;
    writeStorage(PROGRESS_KEY, progress);
    if (spreadIndex === spreads.length - 1) {
      const read = readStorage(READ_STATUS_KEY, []);
      if (!read.includes(currentMagazine.id)) writeStorage(READ_STATUS_KEY, [...read, currentMagazine.id]);
    }
    updateReadStatusButton();
  }

  function renderSpread() {
    const s = spreads[spreadIndex];
    spreadEl.classList.toggle("single", s.type === "single");

    if (s.type === "single") {
      imgRight.src = pagePath(currentMagazine, s.pages[0]);
      imgRight.alt = `Page ${s.pages[0]}`;
      imgLeft.removeAttribute("src");
      imgLeft.alt = "";
    } else {
      imgLeft.src = pagePath(currentMagazine, s.pages[0]);
      imgLeft.alt = `Page ${s.pages[0]}`;
      imgRight.src = pagePath(currentMagazine, s.pages[1]);
      imgRight.alt = `Page ${s.pages[1]}`;
    }

    updateProgress();
    updateDots();
    zonePrev.disabled = spreadIndex === 0;
    zoneNext.disabled = spreadIndex === spreads.length - 1;

    // Keep two spreads ahead (and behind) in the browser cache. The second
    // look-ahead means pages not used by the *next* turn are ready too.
    preloadSpread(spreadIndex - 1);
    preloadSpread(spreadIndex + 1);
    preloadSpread(spreadIndex - 2);
    preloadSpread(spreadIndex + 2);
  }

  function canUsePageTurn(direction, nextIndex) {
    const current = spreads[spreadIndex];
    const next = spreads[nextIndex];
    return current.type === "pair" && next.type === "pair" && direction !== 0;
  }

  function preparePageTurn(direction, nextIndex) {
    const current = spreads[spreadIndex];
    const next = spreads[nextIndex];
    const isForward = direction > 0;

    // Moving forward turns the current right page to the left. Moving back
    // turns the current left page to the right. The second image is the page
    // revealed on the reverse side of that sheet.
    const frontPage = isForward ? current.pages[1] : current.pages[0];
    const backPage = isForward ? next.pages[0] : next.pages[1];
    turnFrontImg.src = pagePath(currentMagazine, frontPage);
    turnBackImg.src = pagePath(currentMagazine, backPage);
    turnSheet.className = `turn-sheet ${isForward ? "turn-next" : "turn-prev"}`;
    turnSheet.hidden = false;

  }

  function startPageTurn() {
    // Give the browser one frame to paint the page in its starting position
    // before applying its rotated state.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => turnSheet.classList.add("is-flipping"));
    });
  }

  async function stageIncomingPage(direction, nextIndex) {
    const next = spreads[nextIndex];
    // This page stays underneath the turning sheet. Loading it into the real
    // reader element before the animation starts prevents a late image paint
    // after the sheet has finished turning.
    const image = direction > 0 ? imgRight : imgLeft;
    const pageNum = direction > 0 ? next.pages[1] : next.pages[0];
    await loadIntoPage(image, pageNum);
  }

  async function stageTurnSheet(direction, nextIndex) {
    const current = spreads[spreadIndex];
    const next = spreads[nextIndex];
    const frontPage = direction > 0 ? current.pages[1] : current.pages[0];
    const backPage = direction > 0 ? next.pages[0] : next.pages[1];
    await Promise.all([
      loadIntoPage(turnFrontImg, frontPage),
      loadIntoPage(turnBackImg, backPage)
    ]);
  }

  function clearPageTurn() {
    turnSheet.className = "turn-sheet";
    turnSheet.hidden = true;
    turnFrontImg.removeAttribute("src");
    turnBackImg.removeAttribute("src");
  }

  async function turn(direction) {
    if (isAnimating) return;
    const nextIndex = spreadIndex + direction;
    if (nextIndex < 0 || nextIndex >= spreads.length) return;

    isAnimating = true;
    if (isRetroPage) {
      spreadIndex = nextIndex;
      renderSpread();
      playUiSound("page-flip");
      isAnimating = false;
      return;
    }
    await preloadSpread(nextIndex);
    playUiSound("page-flip");
    if (canUsePageTurn(direction, nextIndex)) {
      // Put the sheet in place first so staging the destination page cannot
      // flash over the page currently being read.
      preparePageTurn(direction, nextIndex);
      await Promise.all([
        stageIncomingPage(direction, nextIndex),
        stageTurnSheet(direction, nextIndex)
      ]);
      startPageTurn();
      window.setTimeout(() => {
        spreadIndex = nextIndex;
        renderSpread();
        clearPageTurn();
        isAnimating = false;
      }, TURN_MS);
      return;
    }

    const directionClass = direction > 0 ? "turning-next" : "turning-prev";
    spreadEl.classList.add(directionClass, "turning-cover");

    window.setTimeout(() => {
      spreadIndex = nextIndex;
      renderSpread();
    }, COVER_TURN_MS * 0.5);

    window.setTimeout(() => {
      spreadEl.classList.remove(directionClass, "turning-cover");
      window.setTimeout(() => {
        isAnimating = false;
      }, 0);
    }, COVER_TURN_MS);
  }

  /* ---------- events ---------- */

  document.addEventListener("click", (event) => {
    const target = event.target;
    const button = target instanceof Element ? target.closest("button") : null;
    if (button && !button.classList.contains("cover-card")) playUiSound("button");
  }, true);
  zonePrev.addEventListener("click", () => turn(-1));
  zoneNext.addEventListener("click", () => turn(1));
  backBtn.addEventListener("click", closeMagazine);
  bookmarkBtn.addEventListener("click", () => {
    const bookmarks = readStorage(BOOKMARKS_KEY, []);
    const next = bookmarks.includes(currentMagazine.id)
      ? bookmarks.filter((id) => id !== currentMagazine.id)
      : [...bookmarks, currentMagazine.id];
    writeStorage(BOOKMARKS_KEY, next);
    updateBookmarkButton();
    renderShelf();
  });
  shareBtn.addEventListener("click", async () => {
    const url = new URL(`#${currentMagazine.id}`, window.location.href).href;
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (!copied) {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      copied = document.execCommand("copy");
      input.remove();
    }
    shareBtn.textContent = copied ? "Link copied" : "Copy failed";
    window.setTimeout(() => { shareBtn.textContent = "Copy link"; }, 1600);
  });
  readStatusBtn.addEventListener("click", () => {
    const progress = readStorage(PROGRESS_KEY, {});
    delete progress[currentMagazine.id];
    writeStorage(PROGRESS_KEY, progress);
    const read = readStorage(READ_STATUS_KEY, []).filter((id) => id !== currentMagazine.id);
    writeStorage(READ_STATUS_KEY, read);
    spreadIndex = 0;
    renderSpread();
    renderShelf();
    updateReadStatusButton();
  });

  topicDropdownToggle.addEventListener("click", toggleTopicDropdown);
  window.addEventListener("scroll", positionTopicDropdown, { passive: true });
  window.addEventListener("resize", positionTopicDropdown);
  window.addEventListener("resize", updateRetroHeaderOffset);
  window.addEventListener("resize", updateRetroReaderOffset);
  updateRetroHeaderOffset();

  document.addEventListener("click", (e) => {
    if (!topicDropdown.contains(e.target)) closeTopicDropdown();
  });

  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    renderShelf();
  });
  sortSelect.addEventListener("change", () => {
    sortOrder = sortSelect.value;
    renderShelf();
  });
  bookmarksFilter.addEventListener("click", () => {
    showBookmarkedOnly = !showBookmarkedOnly;
    bookmarksFilter.setAttribute("aria-pressed", String(showBookmarkedOnly));
    bookmarksFilter.textContent = showBookmarkedOnly ? "★ Bookmarked" : "☆ Bookmarked";
    renderShelf();
  });

  document.addEventListener("keydown", (e) => {
    if (readerView.hidden) return;
    if (e.key === "ArrowRight") turn(1);
    if (e.key === "ArrowLeft") turn(-1);
    if (e.key === "Escape") closeMagazine();
  });
  book.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  book.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const distance = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) >= 50) turn(distance < 0 ? 1 : -1);
  }, { passive: true });

  /* ---------- shelf heading ---------- */

  const SHELF_HEADINGS = [
    "Pick something off the shelf",
    "Help yourself to a good read",
    "Something's always open here",
    "Find your next read",
    "Take a seat and start reading",
    "The shelf is yours",
    "Come in, have a look around",
    "What are you in the mood for?",
    "Grab something interesting",
    "Every issue's worth a look"
  ];

  function setRandomHeading() {
    const pick = SHELF_HEADINGS[Math.floor(Math.random() * SHELF_HEADINGS.length)];
    shelfHeading.textContent = pick;
  }

  /* ---------- theme ---------- */

  const THEME_KEY = "whcc-zines-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle.querySelector(".theme-toggle-icon").textContent = theme === "light" ? "☾" : "☀";
    themeToggle.setAttribute(
      "aria-label",
      theme === "light" ? "Switch to dark theme" : "Switch to light theme"
    );
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved === "light" ? "light" : "dark");
  }

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  mediaToggle.addEventListener("click", () => {
    mediaPanel.hidden = !mediaPanel.hidden;
    mediaToggle.setAttribute("aria-expanded", String(!mediaPanel.hidden));
    positionMediaPanel();
  });
  musicPlay.addEventListener("click", () => {
    if (!musicAudio.paused) {
      musicAudio.pause();
      musicPlay.textContent = "Play music";
      musicStatus.textContent = "Paused";
      return;
    }
    if (musicAudio.src && musicAudio.paused && musicAudio.readyState > 0) {
      musicAudio.play().then(() => {
        musicPlay.textContent = "Stop music";
      }).catch(() => {
        musicStatus.textContent = "Unable to play this track";
      });
    } else if (musicTimer) {
      stopMusicLoop();
      musicPlay.textContent = "Play music";
      musicStatus.textContent = "Built-in loop paused";
    } else {
      if (musicTracks.length) {
        musicAudio.play().then(() => {
          musicPlay.textContent = "Stop music";
          musicStatus.textContent = musicTracks[musicTrackIndex].title;
        }).catch(() => {
          musicStatus.textContent = "Unable to play this track";
        });
      } else {
        playMusicLoop();
        musicPlay.textContent = "Stop music";
        musicStatus.textContent = "Playing built-in loop";
      }
    }
  });
  musicNext.addEventListener("click", () => {
    if (setMusicTrack(musicTrackIndex + 1, true)) return;
    stopMusicLoop();
    playMusicLoop();
    musicPlay.textContent = "Stop music";
    musicStatus.textContent = "Playing built-in loop";
  });
  musicPrev.addEventListener("click", () => {
    if (setMusicTrack(musicTrackIndex - 1, true)) return;
    musicStatus.textContent = "No music files found";
  });
  musicAudio.addEventListener("timeupdate", () => {
    musicProgress.value = musicAudio.duration ? String((musicAudio.currentTime / musicAudio.duration) * 100) : "0";
    musicTime.textContent = `${formatTime(musicAudio.currentTime)} / ${formatTime(musicAudio.duration)}`;
  });
  musicAudio.addEventListener("ended", () => {
    if (musicTracks.length) setMusicTrack(musicTrackIndex + 1, true);
  });
  musicProgress.addEventListener("input", () => {
    if (musicAudio.duration) musicAudio.currentTime = (Number(musicProgress.value) / 100) * musicAudio.duration;
  });
  fullscreenBtn.addEventListener("click", async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await readerView.requestFullscreen();
    }
    updateFullscreenButton();
  });
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  window.addEventListener("scroll", positionMediaPanel, { passive: true });
  window.addEventListener("resize", positionMediaPanel);

  /* ---------- phone notice ---------- */

  const MOBILE_NOTICE_KEY = "whz-mobile-notice-dismissed";

  // The reader wants a wide, two-page spread and a mouse, so phones get a
  // warning up front rather than silently loading half a layout.
  //
  // Three signals, in order of reliability:
  //   1. userAgentData.mobile — Chrome/Edge/Android report phones accurately.
  //      A `false` isn't final, though: devtools device-emulation keeps it
  //      `false` while faking a phone's UA and touch input, so we keep going.
  //   2. The UA string, for browsers that don't expose userAgentData above:
  //      iPhone/iPod/Windows Phone/BlackBerry/Opera Mini/IEMobile, or Android
  //      *phones* — an Android tablet's UA omits the "Mobile" token, and it
  //      has the width for a spread, so it isn't warned.
  //   3. A capability check — narrow screen *and* touch-only — as the last
  //      resort, which is what actually catches emulated phones.
  const PHONE_UA_TEST = /iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile|Android.+Mobile/i;

  function isPhoneDevice() {
    if (navigator.userAgentData && navigator.userAgentData.mobile === true) return true;
    if (!navigator.userAgentData && PHONE_UA_TEST.test(navigator.userAgent)) return true;
    return window.matchMedia("(max-width: 720px) and (pointer: coarse)").matches;
  }

  function dismissMobileNotice() {
    if (mobileNotice.hidden) return;
    // Remembered so the warning interrupts once, not on every visit — and so
    // moving between index.html and retro.html doesn't show it twice.
    try {
      writeStorage(MOBILE_NOTICE_KEY, true);
    } catch {
      /* private browsing / storage disabled — just hide it for this load */
    }
    mobileNotice.hidden = true;
    document.body.classList.remove("mobile-notice-open");
  }

  function initMobileNotice() {
    if (!mobileNotice || !isPhoneDevice()) return;
    if (readStorage(MOBILE_NOTICE_KEY, null) === true) return;
    mobileNotice.hidden = false;
    document.body.classList.add("mobile-notice-open");
    mobileNoticeDismiss.addEventListener("click", dismissMobileNotice);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") dismissMobileNotice();
    });
    mobileNoticeDismiss.focus();
  }

  /* ---------- init ---------- */

  (async function init() {
    initTheme();
    initMobileNotice();
    setRandomHeading();
    await loadMusicTracks();

    LIBRARY = await buildLibrary();
    renderTopicFilters();
    updateRetroHeaderOffset();
    renderShelf();

    // Deep link support: opening index.html#some-id jumps straight
    // into that magazine, e.g. index.html#demo-issue-01
    const hashId = window.location.hash.replace("#", "");
    const queryId = new URLSearchParams(window.location.search).get("open");
    const deepLinkId = hashId || queryId;
    if (deepLinkId && LIBRARY.some((m) => m.id === deepLinkId)) {
      openMagazine(deepLinkId);
    }
  })();
})();
