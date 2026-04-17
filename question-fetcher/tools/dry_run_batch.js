import http from 'http';
import { performance } from 'perf_hooks';
import fs from 'fs';

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;
const ITER = parseInt(process.env.DRY_RUN_ITER || '30', 10);
const OUT = process.env.DRY_RUN_OUT || 'logs/dry_run_metrics.csv';

if (!fs.existsSync('logs')) fs.mkdirSync('logs');
if (!fs.existsSync('logs/scans')) fs.mkdirSync('logs/scans', { recursive: true });

const results = [];

async function runOnce(i) {
  return new Promise((resolve) => {
    // Use a unique topic each run to avoid cache hits (timestamp + random suffix)
    const uniqueTopic = `dry topic ${i} ${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const data = JSON.stringify({ topic: uniqueTopic, subject: 'Chemistry', exams: ['jee-mains'], images: [] });
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/scan',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer drytoken'
      }
    };
      const start = performance.now();
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const dur = performance.now() - start;
        let parsed = {};
        try { parsed = JSON.parse(body); } catch (e) { parsed = { error: 'parse_error' }; }
        const qc = Array.isArray(parsed.questions) ? parsed.questions.length : 0;
        const diag = parsed.diagnostics || {};
        const gem = diag?.geminiCalls || 0;
        const tavReq = diag?.tavilyRequests || 0;
        const tavCred = diag?.tavilyCredits || 0;
        const metrics = diag?.metrics || {};
        const usedQueries = Array.isArray(diag?.usedQueries) ? diag.usedQueries : [];
        const usedDomains = Array.isArray(diag?.usedDomains) ? diag.usedDomains : [];
        const domainYield = diag?.domainYield || {};

        // persist per-scan JSON for offline analysis
        try {
          fs.writeFileSync(`logs/scans/scan_${i}.json`, JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.warn('Could not write per-scan JSON', e?.message || e);
        }

        const timers = metrics.timers || {};
        const searchMs = (timers.search_end && timers.search_start) ? (timers.search_end - timers.search_start) : '';
        const structMs = (timers.structuring_end && timers.structuring_start) ? (timers.structuring_end - timers.structuring_start) : '';
        const rescueMs = (timers.rescue_end && timers.rescue_start) ? (timers.rescue_end - timers.rescue_start) : '';
        const topDomains = Array.isArray(metrics.top_domains) ? metrics.top_domains.join('|') : usedDomains.join('|');
        const usedQueriesSample = usedQueries.slice(0,3).join('|').replace(/"/g,'');
        const domainYieldEntries = Object.entries(domainYield);
        domainYieldEntries.sort((a,b)=>b[1]-a[1]);
        const domainYieldTop = domainYieldEntries.length ? `${domainYieldEntries[0][0]}:${domainYieldEntries[0][1]}` : '';

        results.push({ i, status: res.statusCode, qc, gem, tavReq, tavCred, dur: Math.round(dur), searchMs, structMs, rescueMs, dedupe: metrics.dedupe_rejections || 0, topupAttempts: metrics.topup_attempts || 0, topupAdded: metrics.topup_added || 0, rescueAdded: metrics.rescue_added || 0, jsonRepairAttempts: metrics.json_repair_attempts || 0, initialSourceCount: metrics.initial_source_count || 0, rescueSeenCount: metrics.rescue_seen_count || 0, finalUniqueSourceCount: metrics.final_unique_source_count || 0, rescueUsed: metrics.rescue_used || false, topDomains, usedQueriesCount: usedQueries.length, usedQueriesSample, domainYieldCount: Object.keys(domainYield).length, domainYieldTop });
        resolve();
      });
    });
    req.on('error', (err) => {
      results.push({ i, status: 0, qc: 0, gem: 0, tavReq: 0, tavCred: 0, dur: 0, error: err.message });
      resolve();
    });
    req.write(data);
    req.end();
  });
}

(async () => {
  for (let i = 1; i <= ITER; i++) {
    // small delay to avoid tight loop
    await runOnce(i);
    await new Promise(r => setTimeout(r, 200));
  }
  const header = ['i','status','question_count','gemini_calls','tavily_requests','tavily_credits','duration_ms','search_ms','structuring_ms','rescue_ms','dedupe_rejections','topup_attempts','topup_added','rescue_added','json_repair_attempts','initial_source_count','rescue_seen_count','final_unique_source_count','rescue_used','top_domains','used_queries_count','used_queries_sample','domain_yield_count','domain_yield_top'];
  const safe = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return `"${String(v).replace(/"/g,'')}"`;
  };
  const csv = [header.join(',')].concat(results.map(r => [r.i,r.status,r.qc,r.gem,r.tavReq,r.tavCred,r.dur,r.searchMs,r.structMs,r.rescueMs,r.dedupe,r.topupAttempts,r.topupAdded,r.rescueAdded,r.jsonRepairAttempts,r.initialSourceCount,r.rescueSeenCount,r.finalUniqueSourceCount,r.rescueUsed,safe(r.topDomains),r.usedQueriesCount,safe(r.usedQueriesSample),r.domainYieldCount,safe(r.domainYieldTop)].join(','))).join('\n');
  fs.writeFileSync(OUT, csv);
  console.log(`Wrote ${OUT} (${results.length} rows)`);
})();
export {};
