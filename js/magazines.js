/**
 * MAGAZINE LIBRARY CONFIG
 * ------------------------------------------------------------
 * This file works two ways depending on how you're running the
 * site:
 *
 *   - Running `python3 serve.py`: you don't need this file at all.
 *     Magazines are found automatically by scanning /magazines on
 *     the server side. Anything listed below still shows up too,
 *     merged in (and wins over an auto-detected one with the same
 *     id) — so it's safe to leave the demo entries here either way.
 *
 *   - Running anything else (VS Code Live Server, another static
 *     server, GitHub Pages, etc.): there's no auto-detection, since
 *     that needs serve.py's /api/magazines.json route. Every
 *     magazine you want to show up has to be listed here by hand,
 *     which is what the entries below already do for the 4 demo
 *     magazines that ship with this project.
 *
 * TO ADD A NEW MAGAZINE BY HAND:
 *   1. Make a folder inside /magazines, e.g. magazines/my-issue/
 *   2. Put a /pages subfolder inside it with your page images,
 *      named page-1.jpg, page-2.jpg, page-3.jpg ... in reading order.
 *      (page-1 is treated as the front cover, the last page as
 *      the back cover.) PNG and JPG both work.
 *   3. Add an entry below, following the same shape as the ones
 *      already here. Add `publisher`, `ageRange`, and `purpose`
 *      to make it appear in the three-column filter menu. Set
 *      `dateAdded` to the publication date to show the New badge
 *      for five days, `editorsPick: true` for the Editor's pick
 *      badge, and `pinned: true` to lift the magazine to the top
 *      of the shelf, directly beneath the ad.
 *
 * LINK A PUBLISHER TO A WEBSITE:
 *   The publisher name on shelf cards and in the reader becomes a
 *   clickable link when you add that publisher's URL to the
 *   `PUBLISHER_WEBSITES` map (see below). Add the exact publisher
 *   name as a key and the website URL as its value — one entry
 *   covers every magazine from that publisher.
 * ------------------------------------------------------------
 */

/**
 * PUBLISHER WEBSITES
 * ------------------------------------------------------------
 * When a publisher name appears in a magazine entry, the app
 * will look it up here. If a URL is found, the publisher name
 * becomes a clickable link on the shelf card and in the reader.
 *
 * Add any publisher that has a website here — you don't need
 * to repeat the URL on every magazine entry.
 * ------------------------------------------------------------
 */
const PUBLISHER_WEBSITES = {
  "Moonbeam Press":     "",
  "Harbour House":      "",
  "Paper Kite Collective": "",
  "North Star Studio":  "",
  "Cedar Street Zines": "",
  "Lantern Room":       "",
  "WHZ group":          "",
  "student":            "",
  "lunch group":        "",
  "organisation":       "",
  "Elektor":            "https://www.elektormagazine.com/"
};

// Add new filter categories here. The key must match the field used on each
// magazine entry or in its meta.json file.
const MAGAZINE_FILTERS = [
  {
    key: "publisher",
    label: "Publisher",
    values: [
      "student",
      "lunch group",
      "organisation",
      "Moonbeam Press",
      "Harbour House",
      "Paper Kite Collective",
      "North Star Studio",
      "Cedar Street Zines",
      "Lantern Room",
      "WHZ group",
      "Elektor"
    ]
  },
  { key: "ageRange", label: "Age range", values: ["under 13", "teen", "parent", "all ages"] },
  {
    key: "purpose",
    label: "Purpose",
    values: [
      "photo album",
      "article",
      "newsletter",
      "poetry",
      "short fiction",
      "interviews",
      "comics",
      "reviews",
      "how-to",
      "photo essay",
      "personal essay",
      "recipes",
      "update log"
    ]
  }
];

const MAGAZINE_LIBRARY = [
  {
    id: "field-notes-01",
    title: "Field Notes",
    issue: "Issue 01 — Autumn",
    dateAdded: "2026-01-01",
    editorsPick: false,
    folder: "magazines/field-notes-01/pages",
    pageCount: 8,
    extension: "png",
    topics: ["travel"],
    publisher: "student",
    ageRange: "teen",
    purpose: "photo album"
  },
  {
    id: "update-0-8-0",
    title: "Update 0.8.0",
    issue: "Issue 0.8.0 — Beta Release",
    dateAdded: "2026-09-29",
    editorsPick: false,
    folder: "magazines/update-0-8-0/pages",
    pageCount: 3,
    extension: "png",
    topics: ["update log"],
    publisher: "WHZ group",
    ageRange: "all ages",
    purpose: "update log"
  },
  {
    id: "this-isnt-ai",
    title: "Test mag by james",
    issue: "Issue 01 — testing 123",
    dateAdded: "2026-09-05",
    editorsPick: true,
    folder: "magazines/this-isnt-ai/pages",
    pageCount: 6,
    extension: "png",
    topics: ["design"],
    publisher: "WHZ group",
    ageRange: "teen",
    purpose: "article"
  },
  {
    id: "how-2",
    title: "NEED HELP NOW",
    issue: "Issue 1/1",
    dateAdded: "2026-09-05",
    folder: "magazines/how-2/pages",
    pageCount: 4,
    extension: "png",
    topics: ["design"],
    publisher: "WHZ group",
    ageRange: "teen",
    purpose: "newsletter"
  },
  {
    id: "studio-log-01",
    title: "Studio Log",
    issue: "Issue 01 — First Draft",
    dateAdded: "2026-01-01",
    folder: "magazines/studio-log-01/pages",
    pageCount: 6,
    extension: "png",
    topics: ["design"],
    publisher: "lunch group",
    ageRange: "under 13",
    purpose: "newsletter"
  },
  {
    id: "the-long-read-03",
    title: "The Long Read",
    issue: "Issue 03 — Winter",
    dateAdded: "2026-01-01",
    folder: "magazines/the-long-read-03/pages",
    pageCount: 10,
    extension: "png",
    topics: ["culture"],
    publisher: "organisation",
    ageRange: "parent",
    purpose: "article"
  },
  {
    id: "wanderlust-weekly-12",
    title: "Wanderlust Weekly",
    issue: "Issue 12 — Coastal",
    dateAdded: "2026-01-01",
    folder: "magazines/wanderlust-weekly-12/pages",
    pageCount: 7,
    extension: "png",
    topics: ["travel", "culture"],
    publisher: "student",
    ageRange: "teen",
    purpose: "photo album"
  },
  {
    id: "dev-notes-01",
    title: "Dev Notes",
    issue: "Issue 01 — How This Site Works",
    dateAdded: "2026-01-01",
    folder: "magazines/dev-notes-01/pages",
    pageCount: 8,
    extension: "png",
    topics: ["dev"],
    publisher: "North Star Studio",
    ageRange: "adult",
    purpose: "how-to"
  },
  {
    id: "placeholder-01",
    title: "Placeholder Zine 01",
    issue: "Sample Issue 01",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-01/pages",
    pageCount: 6,
    extension: "png",
    topics: ["new"],
    publisher: "Moonbeam Press",
    ageRange: "all ages",
    purpose: "poetry"
  },
  {
    id: "placeholder-02",
    title: "Placeholder Zine 02",
    issue: "Sample Issue 02",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-02/pages",
    pageCount: 5,
    extension: "png",
    topics: ["new"],
    publisher: "Harbour House",
    ageRange: "teen",
    purpose: "short fiction"
  },
  {
    id: "placeholder-03",
    title: "Placeholder Zine 03",
    issue: "Sample Issue 03",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-03/pages",
    pageCount: 7,
    extension: "png",
    topics: ["new"],
    publisher: "Paper Kite Collective",
    ageRange: "adult",
    purpose: "interviews"
  },
  {
    id: "placeholder-04",
    title: "Placeholder Zine 04",
    issue: "Sample Issue 04",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-04/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"],
    publisher: "North Star Studio",
    ageRange: "under 13",
    purpose: "comics"
  },
  {
    id: "placeholder-05",
    title: "Placeholder Zine 05",
    issue: "Sample Issue 05",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-05/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"],
    publisher: "Cedar Street Zines",
    ageRange: "all ages",
    purpose: "reviews"
  },
  {
    id: "placeholder-06",
    title: "Placeholder Zine 06",
    issue: "Sample Issue 06",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-06/pages",
    pageCount: 8,
    extension: "png",
    topics: ["new"],
    publisher: "Lantern Room",
    ageRange: "adult",
    purpose: "photo essay"
  },
  {
    id: "placeholder-07",
    title: "Placeholder Zine 07",
    issue: "Sample Issue 07",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-07/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"],
    publisher: "Moonbeam Press",
    ageRange: "teen",
    purpose: "personal essay"
  },
  {
    id: "placeholder-08",
    title: "Placeholder Zine 08",
    issue: "Sample Issue 08",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-08/pages",
    pageCount: 6,
    extension: "png",
    topics: ["new"],
    publisher: "Harbour House",
    ageRange: "all ages",
    purpose: "recipes"
  },
  {
    id: "placeholder-09",
    title: "Placeholder Zine 09",
    issue: "Sample Issue 09",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-09/pages",
    pageCount: 8,
    extension: "png",
    topics: ["new"],
    publisher: "Paper Kite Collective",
    ageRange: "adult",
    purpose: "poetry"
  },
  {
    id: "placeholder-10",
    title: "Placeholder Zine 10",
    issue: "Sample Issue 10",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-10/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"],
    publisher: "North Star Studio",
    ageRange: "teen",
    purpose: "short fiction"
  },
  {
    id: "placeholder-11",
    title: "Placeholder Zine 11",
    issue: "Sample Issue 11",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-11/pages",
    pageCount: 8,
    extension: "png",
    topics: ["new"],
    publisher: "Cedar Street Zines",
    ageRange: "under 13",
    purpose: "comics"
  },
  {
    id: "placeholder-12",
    title: "Placeholder Zine 12",
    issue: "Sample Issue 12",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-12/pages",
    pageCount: 5,
    extension: "png",
    topics: ["new"],
    publisher: "Lantern Room",
    ageRange: "adult",
    purpose: "interviews"
  },
  {
    id: "placeholder-13",
    title: "Placeholder Zine 13",
    issue: "Sample Issue 13",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-13/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"],
    publisher: "Moonbeam Press",
    ageRange: "all ages",
    purpose: "reviews"
  },
  {
    id: "placeholder-14",
    title: "Placeholder Zine 14",
    issue: "Sample Issue 14",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-14/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"],
    publisher: "Harbour House",
    ageRange: "teen",
    purpose: "photo essay"
  },
  {
    id: "placeholder-15",
    title: "Placeholder Zine 15",
    issue: "Sample Issue 15",
    dateAdded: "2026-09-05",
    folder: "magazines/placeholder-15/pages",
    pageCount: 7,
    extension: "png",
    topics: ["new"],
    publisher: "Paper Kite Collective",
    ageRange: "adult",
    purpose: "personal essay"
  },

  {
    id: "ad-elektor",
    title: "Elektor Magazine",
    issue: "Learn about electronics",
    editorsPick: false,
    folder: "magazines/ad-elektor/pages",
    pageCount: 1,
    extension: "svg",
    topics: [],
    publisher: "Elektor",
    ageRange: "all ages",
    purpose: "advertisement",
    adUrl: "https://www.elektormagazine.com/"
  },
  {
    id: "elektor-07-26",
    title: "Elektor",
    issue: "July 2026",
    dateAdded: "2026-07-01",
    editorsPick: true,
    pinned: true,
    folder: "magazines/elektor-07-26/pages",
    pageCount: 116,
    extension: "png",
    topics: [],
    publisher: "Elektor",
    ageRange: "all ages",
    purpose: "how-to"
  },
  {
    id: "elektor-03-26",
    title: "Elektor",
    issue: "March 2026",
    dateAdded: "2026-03-01",
    editorsPick: false,
    pinned: true,
    folder: "magazines/elektor-03-26/pages",
    pageCount: 116,
    extension: "png",
    topics: ["electronics"],
    publisher: "Elektor",
    ageRange: "all ages",
    purpose: "how-to"
  },
  {
    id: "elektor-05-26",
    title: "Elektor",
    issue: "May 2026",
    dateAdded: "2026-05-01",
    editorsPick: false,
    pinned: true,
    folder: "magazines/elektor-05-26/pages",
    pageCount: 116,
    extension: "png",
    topics: ["electronics"],
    publisher: "Elektor",
    ageRange: "all ages",
    purpose: "how-to"
  },
  // {
  //   id: "winter-02",
  //   title: "Field Notes",
  //   issue: "Issue 02 — Winter",
  //   folder: "magazines/winter-02/pages",
  //   pageCount: 24,
  //   extension: "jpg",
  //   topics: ["travel", "culture"],
  //   publisher: "student",
  //   ageRange: "teen",
  //   purpose: "newsletter"
  // },
];
