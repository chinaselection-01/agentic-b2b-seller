import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.join(__dirname, "..", "kb");

// Load every .md file under kb/ into one text blob the agent can read.
export function loadKB() {
  if (!fs.existsSync(KB_DIR)) return "";
  const files = fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  return files
    .map((f) => {
      const body = fs.readFileSync(path.join(KB_DIR, f), "utf8");
      return `# ${f}\n${body}`;
    })
    .join("\n\n");
}

// Naive chunk scoring for the offline stub: split into lines/blocks, score by
// keyword overlap, return the best few blocks so the reply still cites facts.
export function retrieve(kbText, query, topN = 4) {
  const q = query.toLowerCase();
  const qWords = new Set(q.split(/\W+/).filter((w) => w.length > 2));
  const blocks = kbText.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  const scored = blocks
    .map((b) => {
      const lower = b.toLowerCase();
      let score = 0;
      for (const w of qWords) if (lower.includes(w)) score += 1;
      return { b, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((x) => x.b);
  return scored.length ? scored.join("\n\n") : "";
}
