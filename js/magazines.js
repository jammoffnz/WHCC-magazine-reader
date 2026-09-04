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
 *      to make it appear in the three-column filter menu.
 * ------------------------------------------------------------
 */

const MAGAZINE_LIBRARY = [
  {
    id: "field-notes-01",
    title: "Field Notes",
    issue: "Issue 01 — Autumn",
    folder: "magazines/field-notes-01/pages",
    pageCount: 8,
    extension: "png",
    topics: ["travel"],
    publisher: "student",
    ageRange: "teen",
    purpose: "photo album"
  },
  {
    id: "studio-log-01",
    title: "Studio Log",
    issue: "Issue 01 — First Draft",
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
    folder: "magazines/dev-notes-01/pages",
    pageCount: 8,
    extension: "png",
    topics: ["dev"]
  },
  {
    id: "placeholder-01",
    title: "Placeholder Zine 01",
    issue: "Sample Issue 01",
    folder: "magazines/placeholder-01/pages",
    pageCount: 6,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-02",
    title: "Placeholder Zine 02",
    issue: "Sample Issue 02",
    folder: "magazines/placeholder-02/pages",
    pageCount: 5,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-03",
    title: "Placeholder Zine 03",
    issue: "Sample Issue 03",
    folder: "magazines/placeholder-03/pages",
    pageCount: 7,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-04",
    title: "Placeholder Zine 04",
    issue: "Sample Issue 04",
    folder: "magazines/placeholder-04/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-05",
    title: "Placeholder Zine 05",
    issue: "Sample Issue 05",
    folder: "magazines/placeholder-05/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-06",
    title: "Placeholder Zine 06",
    issue: "Sample Issue 06",
    folder: "magazines/placeholder-06/pages",
    pageCount: 8,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-07",
    title: "Placeholder Zine 07",
    issue: "Sample Issue 07",
    folder: "magazines/placeholder-07/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-08",
    title: "Placeholder Zine 08",
    issue: "Sample Issue 08",
    folder: "magazines/placeholder-08/pages",
    pageCount: 6,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-09",
    title: "Placeholder Zine 09",
    issue: "Sample Issue 09",
    folder: "magazines/placeholder-09/pages",
    pageCount: 8,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-10",
    title: "Placeholder Zine 10",
    issue: "Sample Issue 10",
    folder: "magazines/placeholder-10/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-11",
    title: "Placeholder Zine 11",
    issue: "Sample Issue 11",
    folder: "magazines/placeholder-11/pages",
    pageCount: 8,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-12",
    title: "Placeholder Zine 12",
    issue: "Sample Issue 12",
    folder: "magazines/placeholder-12/pages",
    pageCount: 5,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-13",
    title: "Placeholder Zine 13",
    issue: "Sample Issue 13",
    folder: "magazines/placeholder-13/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-14",
    title: "Placeholder Zine 14",
    issue: "Sample Issue 14",
    folder: "magazines/placeholder-14/pages",
    pageCount: 4,
    extension: "png",
    topics: ["new"]
  },
  {
    id: "placeholder-15",
    title: "Placeholder Zine 15",
    issue: "Sample Issue 15",
    folder: "magazines/placeholder-15/pages",
    pageCount: 7,
    extension: "png",
    topics: ["new"]
  }

  // Add more magazines here, following the same shape, e.g.:
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
