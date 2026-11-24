#!/usr/bin/env node
/**
 * Sync & Compile FitLib Vault into Neofit's runtime Knowledge Base bundle.
 *
 * Pulls verified structured data from dopalici/fitlibvault (`fitlib_export.json`)
 * or a local checkout (`--source /path/to/fitlib_export.json`), normalizes IDs,
 * titles, categories, key takeaways, and verified citations, and writes:
 *   - public/knowledge-base.json       (entry map consumed by Neofit RAG + Browser)
 *   - public/knowledge-base-meta.json  (bundle provenance, counts, sync timestamp)
 *
 * Usage:
 *   node scripts/sync-fitlib-vault.mjs
 *   node scripts/sync-fitlib-vault.mjs --source ../fitlibvault/fitlib_export.json
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const DEFAULT_REMOTE_URL =
  "https://raw.githubusercontent.com/dopalici/fitlibvault/main/fitlib_export.json";
const OUTPUT_KB_PATH = path.join(PROJECT_ROOT, "public", "knowledge-base.json");
const OUTPUT_META_PATH = path.join(PROJECT_ROOT, "public", "knowledge-base-meta.json");

function parseArgs(argv) {
  const args = { source: null, url: DEFAULT_REMOTE_URL };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--source" && argv[i + 1]) {
      args.source = path.resolve(argv[i + 1]);
      i += 1;
    } else if (argv[i] === "--url" && argv[i + 1]) {
      args.url = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "neofit-kb-sync/2.0" } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchJson(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${url}: HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
          } catch (err) {
            reject(new Error(`Invalid JSON from ${url}: ${err.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error("Request timed out while downloading FitLib Vault export"));
    });
  });
}

function cleanTitle(rawTitle = "") {
  return String(rawTitle)
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/^#+\s*/, "")
    .trim();
}

function cleanDate(rawDate = "") {
  return String(rawDate || "")
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
}

function normalizeId(rawId = "", title = "") {
  const cleaned = String(rawId || "").trim();
  if (!cleaned || cleaned.includes("KEEP-ORIGINAL")) {
    return cleanTitle(title)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
  }
  return cleaned;
}

function inferCategory(id = "", title = "", series = "") {
  const upperId = id.toUpperCase();
  const upperTitle = title.toUpperCase();
  const prefix = (upperId.match(/^([A-Z]+)/)?.[1] || upperTitle.match(/^([A-Z]+)/)?.[1] || series || "").toUpperCase();

  if (upperId.startsWith("EXL") || upperTitle.startsWith("EXL")) return "Exercise Library";
  if (prefix === "A" || upperId.startsWith("FOUNDATION")) return "Foundational Science";
  if (prefix === "B") return "Strength & Hypertrophy";
  if (prefix === "C") return "Sports Nutrition";
  if (prefix === "D" || prefix === "H") return "Body Composition";
  if (prefix === "E") return "Cardiovascular & Endurance";
  if (prefix === "F") return "Testing, Sleep & Readiness";
  if (prefix === "G") return "Special Populations";
  if (prefix === "I" || prefix === "IX") return "Injury & Rehabilitation";
  if (prefix === "J" || prefix === "K") return "Advanced Programming";
  if (prefix === "M") return "Recovery Science";
  if (prefix === "N") return "Habits & Psychology";
  if (prefix === "O" || prefix === "P" || prefix === "Q" || prefix === "R") {
    return "Longevity & Optimization";
  }
  if (prefix === "X") return "Sports & Physical Skills";
  return "General Exercise Science";
}

function extractSection(content = "", headingRegex) {
  const match = content.match(headingRegex);
  return match ? match[1].trim() : "";
}

function extractQuickTakeaway(content = "") {
  const section = extractSection(
    content,
    /##\s*Quick Takeaway\s*\n([\s\S]*?)(?=\n##\s|$)/i
  );
  if (section) {
    return section.replace(/\s+/g, " ").trim().slice(0, 320);
  }
  const plain = content
    .replace(/^#.*$/gm, "")
    .replace(/\[\[([^[\]]+)\]\]/g, "$1")
    .replace(/[*_`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 260);
}

function extractKeyPoints(content = "") {
  const section = extractSection(
    content,
    /##\s*Key Points\s*\n([\s\S]*?)(?=\n##\s|$)/i
  );
  if (!section) return [];
  return section
    .split("\n")
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter((line) => line.length > 4)
    .slice(0, 6);
}

function normalizeCitations(citations = []) {
  if (!Array.isArray(citations)) return [];
  return citations
    .filter((c) => c && (c.doi || c.pmid || c.author || c.title))
    .slice(0, 8)
    .map((c) => ({
      author: String(c.author || "").replace(/,\s*$/, "").trim(),
      year: c.year || null,
      title: String(c.title || "").trim(),
      journal: String(c.journal || "").trim(),
      type: String(c.type || "Study").trim(),
      doi: c.doi ? String(c.doi).trim() : null,
      pmid: c.pmid ? String(c.pmid).trim() : null,
      validated: Boolean(c.qualityBreakdown?.automationValidated),
    }));
}

function trimContentForRuntime(content = "", maxChars = 3600) {
  const cleaned = String(content || "").replace(/\r\n/g, "\n").trim();
  if (cleaned.length <= maxChars) return cleaned;
  // Preserve Quick Takeaway, Key Points, and primary Deep Dive while keeping bundle nimble
  return `${cleaned.slice(0, maxChars)}\n\n[Truncated for mobile bundle — full reference archived in FitLib Vault]`;
}

async function main() {
  const args = parseArgs(process.argv);
  let rawExport;

  if (args.source) {
    console.log(`Reading local FitLib Vault export: ${args.source}`);
    rawExport = JSON.parse(fs.readFileSync(args.source, "utf8"));
  } else {
    console.log(`Downloading FitLib Vault export from ${args.url}...`);
    rawExport = await fetchJson(args.url);
  }

  const nodes = Array.isArray(rawExport?.nodes) ? rawExport.nodes : [];
  if (nodes.length === 0) {
    throw new Error("FitLib Vault export contained 0 nodes; aborting sync.");
  }

  const entries = {};
  const categoryCounts = {};
  let totalCitations = 0;

  for (const node of nodes) {
    const title = cleanTitle(node.title || node.id);
    if (!title) continue;

    const id = normalizeId(node.id, title);
    const category = inferCategory(id, title, node.series);
    const summary = extractQuickTakeaway(node.content || "");
    const keyPoints = extractKeyPoints(node.content || "");
    const citations = normalizeCitations(node.citations);
    totalCitations += citations.length;

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    entries[id] = {
      id,
      title,
      series: node.series || "Other",
      category,
      updated: cleanDate(node.updated),
      credibilityScore: typeof node.credibilityScore === "number" ? node.credibilityScore : 0.5,
      citationCount: citations.length || Number(node.citationCount) || 0,
      citations,
      summary,
      keyPoints,
      content: trimContentForRuntime(node.content || ""),
      links: Array.isArray(node.links) ? [...new Set(node.links)].slice(0, 20) : [],
      tags: Array.isArray(node.tags) ? [...new Set(node.tags)].slice(0, 15) : [],
    };
  }

  const meta = {
    source: args.source ? `local:${path.basename(args.source)}` : "github:dopalici/fitlibvault",
    vaultExportedAt: rawExport?.metadata?.exported_at || null,
    syncedAt: new Date().toISOString(),
    totalEntries: Object.keys(entries).length,
    totalCitations,
    brokenWikilinks: rawExport?.metadata?.broken_wikilinks ?? 0,
    categories: categoryCounts,
  };

  fs.writeFileSync(OUTPUT_KB_PATH, JSON.stringify(entries), "utf8");
  fs.writeFileSync(OUTPUT_META_PATH, JSON.stringify(meta, null, 2), "utf8");

  const kbSizeKb = Math.round(fs.statSync(OUTPUT_KB_PATH).size / 1024);
  console.log(
    `Synced ${meta.totalEntries} verified notes (${meta.totalCitations} citations, ${meta.brokenWikilinks} broken links) -> public/knowledge-base.json (${kbSizeKb} KB)`
  );
}

main().catch((err) => {
  console.error("FitLib sync failed:", err.message);
  process.exit(1);
});
