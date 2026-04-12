#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import chokidar from 'chokidar';

function getArg(name, defaultVal) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  const inline = process.argv.find(a => a.startsWith(name + '='));
  if (inline) return inline.split('=')[1];
  return defaultVal;
}

const dirArg = getArg('--dir', '.');
const port = Number(getArg('--port', '3030')) || 3030;
const watchDir = path.resolve(process.cwd(), dirArg);

const maxEvents = 500;
const events = [];
const clients = new Set();

function sendEvent(obj) {
  const s = JSON.stringify(obj);
  for (const res of clients) {
    try { res.write(`data: ${s}\n\n`); } catch (e) { /* ignore */ }
  }
  events.push(obj);
  if (events.length > maxEvents) events.shift();
}

async function makeSnippet(filePath) {
  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) return null;
    const ext = path.extname(filePath).toLowerCase();
    if (!['.md', '.txt', '.json', '.mdx'].includes(ext)) return null;
    const buf = await fs.promises.readFile(filePath, 'utf8');
    return buf.slice(0, 2000);
  } catch (e) {
    return null;
  }
}

async function handleEvent(type, p) {
  const rel = path.relative(watchDir, p);
  const snippet = await makeSnippet(p);
  const ev = { type, path: rel, ts: new Date().toISOString(), snippet };
  console.log('[vault-watcher]', ev.type, ev.path);
  sendEvent(ev);
}

const ignored = [
  '**/.git/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.obsidian/plugins/**'
];

const watcher = chokidar.watch(watchDir, { ignored, ignoreInitial: true, persistent: true });
watcher.on('add', p => handleEvent('add', p));
watcher.on('change', p => handleEvent('change', p));
watcher.on('unlink', p => handleEvent('unlink', p));
watcher.on('error', e => console.error('[vault-watcher] watch error', e));

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');
    clients.add(res);
    // send history
    for (const e of events) res.write(`data: ${JSON.stringify(e)}\n\n`);
    req.on('close', () => clients.delete(res));
  } else if (parsed.pathname === '/history') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(events));
  } else if (parsed.pathname === '/graph.json') {
    const filePath = path.join(path.dirname(new URL(import.meta.url).pathname), 'graph.json');
    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    } catch (e) {
      res.writeHead(404);
      res.end('graph.json not found');
    }
  } else if (parsed.pathname === '/graph.html') {
    const filePath = path.join(path.dirname(new URL(import.meta.url).pathname), 'graph.html');
    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  } else if (parsed.pathname === '/' || parsed.pathname === '/feed.html') {
    const filePath = path.join(path.dirname(new URL(import.meta.url).pathname), 'feed.html');
    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`[vault-watcher] listening on http://localhost:${port}/  (watching ${watchDir})`);
});
