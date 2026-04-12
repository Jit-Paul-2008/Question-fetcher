import fs from "fs/promises";
import path from "path";

const VERIFIER_STOPWORDS = new Set([
  "the",
  "is",
  "in",
  "at",
  "of",
  "and",
  "a",
  "an",
  "to",
  "for",
  "on",
  "by",
  "with",
  "that",
  "this",
  "it",
  "as",
  "be",
  "are",
  "was",
  "were",
  "from",
  "or",
  "which",
  "but",
  "has",
  "have",
]);

function splitSentences(text: string) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'\u00C0-\u017F])/u);
}

function buildQuery(sentence: string) {
  const cleaned = sentence.replace(/[^^\p{L}\p{N}\-\s]/gu, " ").toLowerCase();
  const tokens = cleaned
    .split(/\s+/)
    .filter((token) => token && !VERIFIER_STOPWORDS.has(token) && token.length > 1);
  return tokens.join(" ");
}

async function walkMarkdownFiles(dir: string, out: string[]) {
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const itemPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        await walkMarkdownFiles(itemPath, out);
      } else if (item.isFile() && itemPath.endsWith(".md")) {
        out.push(itemPath);
      }
    }
  } catch {
    // Ignore inaccessible verifier paths.
  }
}

function scoreContent(content: string, tokens: string[]) {
  const lc = content.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (!token) continue;
    score += lc.split(token).length - 1;
  }
  return score;
}

async function snippetFor(content: string, tokens: string[]) {
  const lc = content.toLowerCase();
  for (const token of tokens) {
    const idx = lc.indexOf(token);
    if (idx !== -1) {
      const start = Math.max(0, idx - 120);
      return content.slice(start, start + 400).replace(/\n/g, "\n");
    }
  }
  return content.slice(0, 200);
}

async function retrieveFactsInProcess(query: string) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const root = path.resolve("memories", "repo");
  const files: string[] = [];
  await walkMarkdownFiles(root, files);

  const results: Array<{ file: string; score: number; snippet: string }> = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf8");
      const score = scoreContent(content, tokens);
      if (score > 0) {
        const snippet = await snippetFor(content, tokens);
        results.push({ file: path.relative(process.cwd(), file), score, snippet });
      }
    } catch {
      // Skip files that cannot be parsed.
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 10);
}

export async function verifyTextInProcess(text: string) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("empty input");

  const sentences = splitSentences(trimmed)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const report: {
    total_sentences: number;
    supported: Array<{ sentence: string; facts: Array<{ file: string; score: number; snippet: string }> }>;
    unsupported: string[];
    details: Array<{ sentence: string; error: string }>;
  } = {
    total_sentences: sentences.length,
    supported: [],
    unsupported: [],
    details: [],
  };

  for (const sentence of sentences) {
    const query = buildQuery(sentence);
    if (!query) {
      report.unsupported.push(sentence);
      continue;
    }

    try {
      const results = await retrieveFactsInProcess(query);
      if (results.length > 0) {
        report.supported.push({ sentence, facts: results.slice(0, 5) });
      } else {
        report.unsupported.push(sentence);
      }
    } catch (err: any) {
      report.details.push({ sentence, error: err?.message || String(err) });
      report.unsupported.push(sentence);
    }
  }

  return { ok: report.unsupported.length === 0, report };
}
