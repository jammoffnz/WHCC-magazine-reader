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
  const themeToggle = document.getElementById("theme-toggle");
  const readerView = document.getElementById("reader-view");
  const backBtn = document.getElementById("back-btn");
  const titleMain = document.getElementById("reader-title-main");
  const titleIssue = document.getElementById("reader-title-issue");
  const progressEl = document.getElementById("reader-progress");
  const spreadEl = document.getElementById("spread");
  const imgLeft = document.getElementById("img-left");
  const imgRight = document.getElementById("img-right");
  const zonePrev = document.getElementById("zone-prev");
  const zoneNext = document.getElementById("zone-next");
  const dotsEl = document.getElementById("dots");

  let LIBRARY = [];
  let activeFilters = { publisher: "all", ageRange: "all", purpose: "all" };
  let searchQuery = "";
  let currentMagazine = null;
  let spreads = [];
  let spreadIndex = 0;
  let isAnimating = false;

  const TURN_MS = 320; // must match .spread transition duration in style.css

  /* ---------- helpers ---------- */

  function pagePath(mag, pageNum) {
    return `${mag.folder}/page-${pageNum}.${mag.extension}`;
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

  const FILTERS = [
    { key: "publisher", label: "Publisher", values: ["student", "lunch group", "organisation"] },
    { key: "ageRange", label: "Age range", values: ["under 13", "teen", "parent"] },
    { key: "purpose", label: "Purpose", values: ["photo album", "article", "newsletter"] }
  ];

  function filterValues(library, filter) {
    const values = new Set(filter.values);
    library.forEach((mag) => {
      const value = mag[filter.key];
      (Array.isArray(value) ? value : [value]).filter(Boolean).forEach((item) => values.add(String(item)));
    });
    return [...values].sort((a, b) => a.localeCompare(b));
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
      filterValues(LIBRARY, filter).forEach((value) => column.appendChild(makeOption(filter, titleCase(value), value)));
      columns.appendChild(column);
    });
    topicDropdownPanel.appendChild(columns);

    const activeCount = Object.values(activeFilters).filter((value) => value !== "all").length;
    topicDropdownLabel.textContent = activeCount ? `Filters (${activeCount})` : "Filter zines";
    if (activeCount) {
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "clear-filters";
      clear.textContent = "Clear filters";
      clear.addEventListener("click", (event) => {
        event.stopPropagation();
        activeFilters = { publisher: "all", ageRange: "all", purpose: "all" };
        renderTopicFilters();
        renderShelf();
      });
      topicDropdownPanel.appendChild(clear);
    }
  }

  function openTopicDropdown() {
    topicDropdownPanel.hidden = false;
    topicDropdownToggle.setAttribute("aria-expanded", "true");
  }
  function closeTopicDropdown() {
    topicDropdownPanel.hidden = true;
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
      return matchesFilters && matchesSearch;
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
      // Random tilt each render, so covers don't fall into a visible pattern.
      const tilt = (Math.random() * 5 - 2.5).toFixed(2);
      card.style.setProperty("--tilt", `${tilt}deg`);
      card.addEventListener("click", () => openMagazine(mag.id));

      const thumb = document.createElement("div");
      thumb.className = "cover-thumb";
      const img = document.createElement("img");
      img.src = pagePath(mag, 1);
      img.alt = `${mag.title} cover`;
      thumb.appendChild(img);

      const caption = document.createElement("div");
      caption.className = "cover-caption";
      caption.textContent = mag.title;
      const small = document.createElement("small");
      small.textContent = mag.issue
        ? `${mag.issue} · ${mag.pageCount} pages`
        : `${mag.pageCount} pages`;
      caption.appendChild(small);

      card.appendChild(thumb);
      card.appendChild(caption);
      shelfGrid.appendChild(card);
    });
  }

  /* ---------- reader ---------- */

  function openMagazine(id) {
    const mag = LIBRARY.find((m) => m.id === id);
    if (!mag) return;

    currentMagazine = mag;
    spreads = buildSpreads(mag.pageCount);
    spreadIndex = 0;

    titleMain.textContent = mag.title;
    titleIssue.textContent = mag.issue;

    renderDots();
    renderSpread();

    shelfView.hidden = true;
    readerView.hidden = false;
  }

  function closeMagazine() {
    readerView.hidden = true;
    shelfView.hidden = false;
    currentMagazine = null;
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
  }

  function turn(direction) {
    if (isAnimating) return;
    const nextIndex = spreadIndex + direction;
    if (nextIndex < 0 || nextIndex >= spreads.length) return;

    isAnimating = true;
    spreadEl.classList.add(direction > 0 ? "turning-next" : "turning-prev");

    window.setTimeout(() => {
      spreadIndex = nextIndex;
      renderSpread();
      spreadEl.classList.remove("turning-next", "turning-prev");
      window.setTimeout(() => {
        isAnimating = false;
      }, TURN_MS);
    }, TURN_MS * 0.5);
  }

  /* ---------- events ---------- */

  zonePrev.addEventListener("click", () => turn(-1));
  zoneNext.addEventListener("click", () => turn(1));
  backBtn.addEventListener("click", closeMagazine);

  topicDropdownToggle.addEventListener("click", toggleTopicDropdown);

  document.addEventListener("click", (e) => {
    if (!topicDropdown.contains(e.target)) closeTopicDropdown();
  });

  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    renderShelf();
  });

  document.addEventListener("keydown", (e) => {
    if (readerView.hidden) return;
    if (e.key === "ArrowRight") turn(1);
    if (e.key === "ArrowLeft") turn(-1);
    if (e.key === "Escape") closeMagazine();
  });

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

  /* ---------- init ---------- */

  (async function init() {
    initTheme();
    setRandomHeading();

    LIBRARY = await buildLibrary();
    renderTopicFilters();
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
