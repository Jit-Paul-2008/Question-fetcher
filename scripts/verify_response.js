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
  const m = text.match(/[^.!?]+[.!?]*/g);
  return m ? m : [text];
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
  for (const s of sentences) {
    // limit query size
    const q = s.length > 300 ? s.slice(0, 300) : s;
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
