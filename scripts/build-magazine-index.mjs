/**
 * Creates the magazine catalogue for static hosts such as Netlify.
 * Netlify runs this before each deploy, so adding a folder under
 * /magazines is enough to make it appear on the shelf.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const magazinesDir = path.join(root, "magazines");
const outputDir = path.join(root, "api");
const pagePattern = /^page-(\d+)\.([a-zA-Z0-9]+)$/i;
const topicPattern = /^topic-(.+)$/i;

function titleCase(value) {
  return value
    .trim()
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

async function readMeta(folderPath) {
  try {
    const parsed = JSON.parse(await readFile(path.join(folderPath, "meta.json"), "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function scanMagazine(folderName) {
  const folderPath = path.join(magazinesDir, folderName);
  let entries;
  try {
    entries = await readdir(folderPath, { withFileTypes: true });
  } catch {
    return null;
  }

  const pagesDir = path.join(folderPath, "pages");
  let pages;
  try {
    pages = await readdir(pagesDir);
  } catch {
    return null;
  }

  const numberedPages = pages
    .map((name) => {
      const match = pagePattern.exec(name);
      return match ? { number: Number(match[1]), extension: match[2] } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.number - b.number);
  if (!numberedPages.length) return null;

  const meta = await readMeta(folderPath);
  const topics = new Set(
    entries
      .map((entry) => topicPattern.exec(entry.name))
      .filter(Boolean)
      .map((match) => match[1].replace(/\.[a-zA-Z0-9]{1,6}$/, "").toLowerCase())
  );
  if (Array.isArray(meta.topics)) {
    meta.topics.forEach((topic) => topics.add(String(topic).toLowerCase()));
  }

  return {
    id: folderName,
    title: meta.title || titleCase(folderName),
    issue: meta.issue || "",
    folder: `magazines/${folderName}/pages`,
    pageCount: numberedPages.length,
    extension: numberedPages[0].extension,
    topics: [...topics].sort(),
    publisher: meta.publisher || "",
    ageRange: meta.ageRange || "",
    purpose: meta.purpose || ""
  };
}

let folderEntries = [];
try {
  folderEntries = await readdir(magazinesDir, { withFileTypes: true });
} catch {
  // An empty catalogue is still a valid deploy when /magazines is absent.
}

const magazines = (
  await Promise.all(
    folderEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => scanMagazine(entry.name))
  )
)
  .filter(Boolean)
  .sort((a, b) => a.id.localeCompare(b.id));

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "magazines.json"), `${JSON.stringify(magazines, null, 2)}\n`);
console.log(`Built catalogue for ${magazines.length} magazine${magazines.length === 1 ? "" : "s"}.`);
