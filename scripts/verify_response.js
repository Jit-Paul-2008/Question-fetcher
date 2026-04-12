#!/usr/bin/env node
import fs from 'fs/promises';
import { spawnSync } from 'child_process';

async function readInput() {
  const idx = process.argv.indexOf('--file');
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return await fs.readFile(process.argv[idx + 1], 'utf8');
  }
  if (!process.stdin.isTTY) {
    let s = '';
    for await (const chunk of process.stdin) s += chunk;
    return s;
  }
  const arg = process.argv.slice(2).join(' ').trim();
  if (arg) return arg;
  console.error('Usage: verify_response.js --file <file> OR pipe text OR pass text as args');
  process.exit(2);
}

function splitSentences(text) {
  // Split on punctuation followed by whitespace and a capital/digit/quote (avoid splitting decimals like 2.5)
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'\u00C0-\u017F])/u);
}

function retrieveFor(query) {
  const proc = spawnSync('node', ['scripts/retrieve_facts.js', query], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (proc.error) return { error: proc.error.message, stdout: proc.stdout, stderr: proc.stderr };
  const out = (proc.stdout || '').trim();
  if (!out) return { results: [] };
  try {
    const parsed = JSON.parse(out);
    return { results: parsed };
  } catch (e) {
    return { error: 'parse', stdout: out, stderr: proc.stderr };
  }
}

(async function main() {
  const text = (await readInput() || '').trim();
  if (!text) { console.error('empty input'); process.exit(2); }
  const sentences = splitSentences(text).map(s => s.trim()).filter(Boolean);
  const report = { total_sentences: sentences.length, supported: [], unsupported: [], details: [] };
  const STOPWORDS = new Set(['the','is','in','at','of','and','a','an','to','for','on','by','with','that','this','it','as','be','are','was','were','from','or','which','but','has','have']);
  function buildQuery(s){
    // normalize: remove punctuation except hyphens and digits/letters, lower-case, split, remove stopwords
    const cleaned = s.replace(/[^\p{L}\p{N}\-\s]/gu,' ').toLowerCase();
    const toks = cleaned.split(/\s+/).filter(t=>t && !STOPWORDS.has(t) && t.length>1);
    return toks.join(' ');
  }

  for (const s of sentences) {
    const q = buildQuery(s);
    if(!q){ report.unsupported.push(s); continue; }
    const r = retrieveFor(q);
    if (r.error) {
      report.details.push({ sentence: s, error: r.error, stdout: r.stdout, stderr: r.stderr });
      report.unsupported.push(s);
      continue;
    }
    if (r.results && r.results.length > 0) {
      report.supported.push({ sentence: s, facts: r.results.slice(0, 5) });
    } else {
      report.unsupported.push(s);
    }
  }
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.unsupported.length > 0 ? 1 : 0);
})();
