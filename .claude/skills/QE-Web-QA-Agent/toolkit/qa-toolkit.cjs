#!/usr/bin/env node
'use strict';

/**
 * qa-toolkit — deterministic helper CLI for qa-pack skills.
 *
 * Every command here does work that would otherwise cost an LLM a full file
 * Read (or worse, an in-context reasoning pass) to accomplish: parsing
 * markdown tables, hashing DOM snapshots, scoring string similarity, walking
 * git history, aggregating dozens of product_context files. None of that
 * needs a model — it needs a parser. Skills shell out here via Bash and read
 * only the one-line (or few-line) result, never the underlying file.
 *
 * No npm dependencies (qa-pack ships none) — Node core only.
 * Always invoked from the repo root, e.g.:
 *   node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs <command> [--flags]
 *
 * Shared by both the web and mobile QA tracks (web-qa-agent, mobile-qa-agent, and
 * every skill under skills/web, skills/mobile, skills/shared) — it lives under
 * web-qa-agent/ only because that's where the pack's original product_context store
 * already was; mobile-qa-agent points at this same path rather than duplicating it,
 * so one product's context.md keeps tracking both web and mobile history together
 * (see the `--namespace mobile` flag on trust-record/trust-status/locator-*).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();

// ── .env loading ─────────────────────────────────────────────────────────
// Every doc in the pack tells users to put QA_* config in `.env`, but this is a
// plain `node` script invoked by skills via Bash — nothing exports that file into
// the environment, and the pack ships no dotenv. Without this, every
// `process.env.QA_*` read below is permanently undefined and the features gated
// on them (token tracking) are silent no-ops no matter what the user
// configures. Real env vars always win, so an explicit `export` still overrides.
function loadDotEnv() {
  let raw;
  try { raw = fs.readFileSync(path.join(ROOT, '.env'), 'utf8'); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue; // blank line, comment, or malformed — skip
    let val = m[2].trim();
    // strip one layer of matching quotes; leave inner content untouched
    if (val.length >= 2 && ((val[0] === '"' && val.endsWith('"')) || (val[0] === "'" && val.endsWith("'")))) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}
loadDotEnv();
const PRODUCT_CONTEXT_ROOT = path.join(ROOT, '.claude', 'skills', 'QE-Web-QA-Agent', 'product_context');
const OUTPUTS_DIR = path.join(ROOT, 'outputs');
const TRUST_THRESHOLD = 5;

// ── generic fs / arg helpers ─────────────────────────────────────────────

function productDir(product) { return path.join(PRODUCT_CONTEXT_ROOT, product); }
function contextFile(product) { return path.join(productDir(product), 'context.md'); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}
function readJson(p, fallback) {
  const raw = readFileSafe(p);
  if (raw === null) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
function writeJson(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}
function readStdinSync() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

function listProductFolders() {
  if (!fs.existsSync(PRODUCT_CONTEXT_ROOT)) return [];
  return fs.readdirSync(PRODUCT_CONTEXT_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(PRODUCT_CONTEXT_ROOT, e.name, 'context.md')))
    .map((e) => e.name);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    }
  }
  return args;
}

function requireArgs(args, names) {
  const missing = names.filter((n) => args[n] === undefined);
  if (missing.length) {
    console.log(`ERROR: missing required flag(s): ${missing.map((n) => '--' + n).join(', ')}`);
    process.exit(1);
  }
}

// ── markdown table parsing (context.md tables) ───────────────────────────

function extractSectionLines(content, headingText) {
  const lines = content.split('\n');
  const headingRe = new RegExp('^##\\s+' + headingText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i');
  const start = lines.findIndex((l) => headingRe.test(l.trim()));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end);
}

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim());
}

function parseMarkdownTable(sectionLines) {
  const tableLines = sectionLines.filter((l) => l.trim().startsWith('|'));
  if (tableLines.length < 2) return { headers: [], rows: [] };
  const headers = splitRow(tableLines[0]);
  const rows = tableLines.slice(2).map((line) => {
    const cells = splitRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] !== undefined ? cells[i] : ''; });
    return obj;
  });
  return { headers, rows };
}

function isPlaceholderRow(row) {
  const values = Object.values(row);
  if (!values.length) return true;
  if (/^—+$/.test(values[0] || '')) return true;
  const joined = values.join(' ');
  return /\{[^}]+\}/.test(joined) || /No bugs filed yet/i.test(joined);
}

/** Returns { found: bool, rows: [...] } — found=false means no context.md at all yet. */
function getTable(product, headingText) {
  const content = readFileSafe(contextFile(product));
  if (content === null) return { found: false, rows: [] };
  const section = extractSectionLines(content, headingText);
  if (!section) return { found: true, rows: [] };
  const { rows } = parseMarkdownTable(section);
  return { found: true, rows: rows.filter((r) => !isPlaceholderRow(r)) };
}

function getProductInfo(product) {
  const content = readFileSafe(contextFile(product));
  const info = {};
  if (!content) return info;
  const patterns = {
    name: /\*\*Product Name\*\*:\s*(.+)/i,
    appUrl: /\*\*App URL\*\*:\s*(.+)/i,
    env: /\*\*Environment\*\*:\s*(.+)/i,
    key: /\*\*Jira Project Key\*\*:\s*(.+)/i,
  };
  for (const [k, re] of Object.entries(patterns)) {
    const m = content.match(re);
    if (m) info[k] = m[1].trim();
  }
  return info;
}

// ── list-products ─────────────────────────────────────────────────────────

function cmdListProducts() {
  const products = listProductFolders();
  if (!products.length) { console.log('NO_PRODUCTS'); return; }
  products.forEach((p) => console.log(p));
}

// ── get-bugs / get-runs (cheap reads — no LLM file parse needed) ─────────

function cmdGetBugs(args) {
  requireArgs(args, ['product']);
  const { found, rows } = getTable(args.product, 'Known Bugs');
  if (!found) return console.log('NO_CONTEXT_FILE');
  if (!rows.length) return console.log('NO_BUGS');
  rows.forEach((r) => console.log([r['Bug ID'], r['Title'], r['Severity'], r['Status'], r['Card']].join(' | ')));
}

function cmdGetSelectors(args) {
  requireArgs(args, ['product']);
  const { found, rows } = getTable(args.product, 'Element Selectors');
  if (!found) return console.log('NO_CONTEXT_FILE');
  const filtered = args.url ? rows.filter((r) => (r['Page URL'] || '').includes(args.url)) : rows;
  if (!filtered.length) return console.log('NO_SELECTORS');
  filtered.forEach((r) =>
    console.log([r['Element Label'], r['Page URL'], r['Locator'], r['Method'], r['data-testid'], r['Card']].join(' | '))
  );
}

function cmdGetRuns(args) {
  requireArgs(args, ['product']);
  const { found, rows } = getTable(args.product, 'Runs Log');
  if (!found) return console.log('NO_CONTEXT_FILE');
  const filtered = args.phase
    ? rows.filter((r) => (r['Phase'] || '').toLowerCase().includes(String(args.phase).toLowerCase()))
    : rows;
  if (!filtered.length) return console.log('NO_RUNS');
  filtered.forEach((r) =>
    console.log([r['Date'], r['Card'], r['Phase'], r['Outcome'], r['Bugs Filed'], r['Reuse %'], r['Notes']].join(' | '))
  );
}

// ── fingerprint: DOM fingerprint cache ────────────────────────────────────

function hashList(items) {
  const sorted = [...new Set(items)].sort();
  return crypto.createHash('sha1').update(sorted.join('\n')).digest('hex').slice(0, 16);
}

function cmdFingerprint(args) {
  requireArgs(args, ['product', 'url']);
  const testids = String(args.testids || '').split(',').map((s) => s.trim()).filter(Boolean);
  const file = path.join(productDir(args.product), 'dom-fingerprints.json');
  const store = readJson(file, {});
  const newHash = hashList(testids);
  const prev = store[args.url];
  const changed = !prev || prev.hash !== newHash;
  store[args.url] = { hash: newHash, count: testids.length, updatedAt: todayStr() };
  writeJson(file, store);

  if (!prev) console.log('NEW — no prior fingerprint for this page. Run full DOM discovery.');
  else if (changed) {
    console.log(`CHANGED — DOM signature differs from ${prev.updatedAt} (${prev.count} → ${testids.length} testids). Re-discover this page.`);
  } else {
    console.log(`UNCHANGED — matches fingerprint from ${prev.updatedAt}. Skip DOM re-discovery, reuse cached selectors.`);
  }
}

// ── pii-scan: PII / secrets scan before any Jira post ─────────────────────

const PII_PATTERNS = [
  { name: 'email', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { name: 'ssn', re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: 'credit_card', re: /\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,4}\b|\b\d{15,16}\b/g },
  { name: 'aws_key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'openai_key', re: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { name: 'github_token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { name: 'slack_token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'gcp_key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: 'jwt', re: /\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { name: 'generic_secret_assignment', re: /\b(api[_-]?key|secret|password|passwd|token)\b\s*[:=]\s*["']?[^\s"'<]{6,}/gi },
];

function redact(match) {
  const s = String(match);
  if (s.length <= 4) return '*'.repeat(s.length);
  return s.slice(0, 2) + '*'.repeat(Math.max(s.length - 4, 3)) + s.slice(-2);
}

function cmdPiiScan(args) {
  let text;
  if (args.file) {
    text = readFileSafe(args.file);
    if (text === null) { console.log(`ERROR: cannot read ${args.file}`); process.exit(1); }
  } else {
    text = readStdinSync();
  }
  const findings = [];
  for (const { name, re } of PII_PATTERNS) {
    const matches = text.match(re) || [];
    if (matches.length) findings.push({ name, count: matches.length, sample: redact(matches[0]) });
  }
  if (!findings.length) return console.log('CLEAN');
  console.log(`FLAGGED: ${findings.length} pattern type(s) detected — confirm with the user before posting`);
  findings.forEach((f) => console.log(`  - ${f.name}: ${f.count} match(es), e.g. "${f.sample}"`));
}

// ── dup-bug: duplicate-bug detector ───────────────────────────────────────

function tokenize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
}

function diceSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (!setA.size || !setB.size) return 0;
  let overlap = 0;
  for (const w of setA) if (setB.has(w)) overlap++;
  return (2 * overlap) / (setA.size + setB.size);
}

function resolveTextArg(args, inlineKey, fileKey) {
  if (args[fileKey]) {
    const content = readFileSafe(args[fileKey]);
    if (content === null) { console.log(`ERROR: cannot read ${args[fileKey]}`); process.exit(1); }
    return content.trim();
  }
  return args[inlineKey];
}

function cmdDupBug(args) {
  requireArgs(args, ['product']);
  const summary = resolveTextArg(args, 'summary', 'summary-file');
  if (!summary) { console.log('ERROR: --summary or --summary-file required'); process.exit(1); }
  const { found, rows } = getTable(args.product, 'Known Bugs');
  if (!found || !rows.length) return console.log('NO_DUPLICATE_FOUND — no bug history yet');
  const scored = rows
    .map((r) => ({ id: r['Bug ID'], title: r['Title'], status: r['Status'], score: diceSimilarity(summary, r['Title']) }))
    .filter((r) => r.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (!scored.length) return console.log('NO_DUPLICATE_FOUND');
  scored.forEach((r) => console.log(`POSSIBLE_DUPLICATE: ${r.id} (score ${r.score.toFixed(2)}, status ${r.status}) — "${r.title}"`));
}

// ── cost-estimate: pre-run cost estimate ──────────────────────────────────

function tryReadTrackingLog() {
  const dir = process.env.QA_TRACKING_DIR;
  if (!dir) return null;
  return readJson(path.join(dir, 'token_usage_log.json'), null);
}

function avgTokensForCards(tracking, cardIds) {
  if (!Array.isArray(tracking)) return null;
  const entries = tracking.filter((e) => e && cardIds.has(e.card));
  const totals = entries.map((e) => (e.input_tokens || 0) + (e.output_tokens || 0)).filter((v) => v > 0);
  if (!totals.length) return null;
  return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
}

function cmdCostEstimate(args) {
  requireArgs(args, ['product']);
  const { found, rows } = getTable(args.product, 'Runs Log');
  if (!found || !rows.length) {
    console.log(`No run history yet for ${args.product} — first run, no estimate available.`);
    return;
  }
  const phase = args.phase ? String(args.phase) : '';
  const relevant = phase ? rows.filter((r) => (r['Phase'] || '').toLowerCase().includes(phase.toLowerCase())) : rows;
  const pool = relevant.length ? relevant : rows;
  const n = pool.length;

  const reuseVals = pool.map((r) => parseFloat((r['Reuse %'] || '').replace('%', ''))).filter((v) => !isNaN(v));
  const avgReuse = reuseVals.length ? Math.round(reuseVals.reduce((a, b) => a + b, 0) / reuseVals.length) : null;
  const bugRuns = pool.filter((r) => (r['Bugs Filed'] || '').trim() && r['Bugs Filed'] !== '—').length;

  const tracking = tryReadTrackingLog();
  const avgTok = tracking ? avgTokensForCards(tracking, new Set(pool.map((r) => r['Card']))) : null;
  const tokenLine = avgTok ? `, ~${avgTok.toLocaleString()} tokens/run avg` : '';

  console.log(
    `Estimated for ${args.product}${phase ? ' (Phase ' + phase + ')' : ''}: based on ${n} past run(s), ` +
    `avg reuse ${avgReuse !== null ? avgReuse + '%' : 'n/a'}${tokenLine}. ${bugRuns}/${n} past runs found bugs.`
  );
}

// ── risk-score: risk-based test ordering ──────────────────────────────────

function gitChangedFiles(days) {
  const res = spawnSync('git', ['log', `--since=${days} days ago`, '--name-only', '--pretty=format:'], {
    cwd: ROOT, encoding: 'utf8',
  });
  if (res.status !== 0 || !res.stdout) return [];
  return res.stdout.split('\n').map((s) => s.trim()).filter(Boolean);
}

function cmdRiskScore(args) {
  requireArgs(args, ['product', 'modules']);
  const modules = String(args.modules).split(',').map((s) => s.trim()).filter(Boolean);
  if (!modules.length) { console.log('ERROR: --modules "a,b,c" required'); process.exit(1); }
  const changedFiles = gitChangedFiles(180);
  const { rows: bugRows } = getTable(args.product, 'Known Bugs');

  const scored = modules
    .map((mod) => {
      const kw = mod.toLowerCase();
      const churn = changedFiles.filter((f) => f.toLowerCase().includes(kw)).length;
      const bugs = (bugRows || []).filter((r) => (r['Title'] || '').toLowerCase().includes(kw)).length;
      return { mod, churn, bugs, risk: churn * 0.6 + bugs * 3 };
    })
    .sort((a, b) => b.risk - a.risk);

  scored.forEach((s, i) =>
    console.log(`${i + 1}. ${s.mod} — risk ${s.risk.toFixed(1)} (${s.churn} commits/180d, ${s.bugs} known bug${s.bugs === 1 ? '' : 's'})`)
  );
}

// ── trust: trust ratchet on auto-approve ──────────────────────────────────

// `namespace` (optional) routes to trust.{namespace}.json instead of trust.json — full
// isolation for a second automation surface (e.g. mobile-automation) on the same product,
// so its gate streaks never enter the min() that decides an unrelated pipeline's eligibility.
// Omitted → identical behavior to before this flag existed (trust.json, no callers changed).
function trustFile(product, namespace) {
  return path.join(productDir(product), namespace ? `trust.${namespace}.json` : 'trust.json');
}

function cmdTrustRecord(args) {
  requireArgs(args, ['product', 'gate', 'result']);
  const file = trustFile(args.product, args.namespace);
  const store = readJson(file, {});
  if (!store[args.gate]) store[args.gate] = { clean: 0, edited: 0, streak: 0 };
  if (args.result === 'clean') { store[args.gate].clean++; store[args.gate].streak++; }
  else { store[args.gate].edited++; store[args.gate].streak = 0; }
  writeJson(file, store);
  console.log(`Recorded — ${args.gate}: streak ${store[args.gate].streak}, ${store[args.gate].clean} clean / ${store[args.gate].edited} edited total.`);
}

function cmdTrustStatus(args) {
  requireArgs(args, ['product']);
  const store = readJson(trustFile(args.product, args.namespace), {});
  const gates = Object.keys(store);
  if (!gates.length) return console.log('NOT_ELIGIBLE — no gate history yet for this product.');
  const minStreak = Math.min(...gates.map((g) => store[g].streak || 0));
  const summary = gates.map((g) => `${g}: streak ${store[g].streak}`).join(', ');
  if (minStreak >= TRUST_THRESHOLD) {
    console.log(`ELIGIBLE — ${summary}. All gates clean for ${minStreak}+ consecutive runs; offer to raise autonomy for this product.`);
  } else {
    console.log(`NOT_ELIGIBLE — ${summary} (needs ${TRUST_THRESHOLD} consecutive clean approvals to qualify).`);
  }
}

// ── locator: self-improving locator memory ────────────────────────────────

function locatorFile(product) { return path.join(productDir(product), 'locator-learnings.md'); }

function ensureLocatorFile(product) {
  const file = locatorFile(product);
  if (!fs.existsSync(file)) {
    ensureDir(path.dirname(file));
    fs.writeFileSync(
      file,
      `# Locator Learnings — ${product}\n` +
      `Auto-maintained by qa-toolkit.cjs — do not edit by hand.\n\n` +
      `| Page | Element | Failed Locator | Working Locator | Reason | Card | Date |\n` +
      `|------|---------|-----------------|------------------|--------|------|------|\n`
    );
  }
  return file;
}

// Markdown-table-safe cell: locators legitimately contain "|" (xpath unions especially) —
// escape it rather than let it silently corrupt the table's column count on re-parse.
function tableCell(v) {
  return String(v ?? '').replace(/\|/g, '&#124;').replace(/\n/g, ' ').trim();
}

function cmdLocatorRecord(args) {
  // Free-text locator strings routinely contain quotes/brackets that are unsafe to inline
  // into a shell command — accept a JSON --file as the safe path; individual --flags remain
  // for short, technical values a skill is confident contain no special characters.
  let fields = args;
  if (args.file) {
    const parsed = readJson(args.file, null);
    if (!parsed) { console.log(`ERROR: cannot read/parse JSON at ${args.file}`); process.exit(1); }
    fields = parsed;
  }
  const { product, page, element, failed, fixed, reason, card } = fields;
  if (!product || !page || !element || !fixed) {
    console.log('ERROR: --product --page --element --fixed required (or an equivalent --file JSON)');
    process.exit(1);
  }
  const file = ensureLocatorFile(product);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const key = `${page}|||${element}`.toLowerCase();
  const rowLine = `| ${tableCell(page)} | ${tableCell(element)} | ${tableCell(failed || '—')} | ${tableCell(fixed)} | ${tableCell(reason || '—')} | ${tableCell(card || '—')} | ${todayStr()} |`;

  const filtered = lines.filter((l) => {
    if (!l.trim().startsWith('|')) return true;
    const cells = splitRow(l);
    if (cells.length < 3 || cells[0] === 'Page') return true; // keep header row
    return `${cells[0]}|||${cells[1]}`.toLowerCase() !== key;
  });
  while (filtered.length && filtered[filtered.length - 1].trim() === '') filtered.pop();
  filtered.push(rowLine);
  fs.writeFileSync(file, filtered.join('\n') + '\n');
  console.log(`Locator learning recorded: ${element} on ${page} → ${fixed}`);
}

function cmdLocatorQuery(args) {
  requireArgs(args, ['product']);
  const content = readFileSafe(locatorFile(args.product));
  if (!content) return console.log('NONE — no locator learnings yet for this product.');
  const dataLines = content.split('\n').filter(
    (l) => l.trim().startsWith('|') && !l.includes('---') && !l.trim().startsWith('| Page |')
  );
  const matches = args.page ? dataLines.filter((l) => l.toLowerCase().includes(String(args.page).toLowerCase())) : dataLines;
  if (!matches.length) return console.log('NONE — no learnings for this page yet.');
  matches.forEach((l) => console.log(l.trim()));
}

// ── compact-context: periodic context.md compaction ────────────────────────
//
// context.md grows by at least one Runs Log row every run, forever — nothing
// currently caps it, so a long-lived product's context eventually gets big
// enough to be an expensive read on every qa-agent startup. This rolls old
// rows into compact summaries and moves the full originals to
// product_context/{PRODUCT}/history/ — nothing is ever deleted, only moved out
// of the file that gets read every run. qa-agent calls this once per run; it is
// a no-op (just an incremented counter) until the 5th call.

const COMPACT_EVERY_N_RUNS = 5;
const KEEP_RECENT_RUNS = 10;
const KEEP_RECENT_CLOSED_BUGS = 20;
const KEEP_RECENT_ENV_NOTES = 15;

function historyDir(product) { return path.join(productDir(product), 'history'); }

function appendHistory(product, filename, header, block) {
  const file = path.join(historyDir(product), filename);
  ensureDir(historyDir(product));
  if (!fs.existsSync(file)) fs.writeFileSync(file, header);
  fs.appendFileSync(file, block);
}

function findSection(lines, headingText) {
  const headingRe = new RegExp('^##\\s+' + headingText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i');
  const start = lines.findIndex((l) => headingRe.test(l.trim()));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) { end = i; break; }
  }
  return { start, end };
}

function findTableRange(lines, headingText) {
  const section = findSection(lines, headingText);
  if (!section) return null;
  let headerIdx = -1;
  for (let i = section.start + 1; i < section.end; i++) {
    if (lines[i].trim().startsWith('|')) { headerIdx = i; break; }
  }
  if (headerIdx === -1) return null;
  const sepIdx = headerIdx + 1;
  let dataEnd = sepIdx + 1;
  while (dataEnd < section.end && lines[dataEnd].trim().startsWith('|')) dataEnd++;
  return { ...section, headerIdx, sepIdx, dataStart: sepIdx + 1, dataEnd, headers: splitRow(lines[headerIdx]) };
}

function rowsFromRange(lines, range) {
  return lines.slice(range.dataStart, range.dataEnd).map((l) => {
    const cells = splitRow(l);
    const obj = {};
    range.headers.forEach((h, i) => { obj[h] = cells[i] !== undefined ? cells[i] : ''; });
    return obj;
  });
}

function renderRow(headers, obj) {
  return '| ' + headers.map((h) => tableCell(obj[h] !== undefined ? obj[h] : '')).join(' | ') + ' |';
}

function upsertProductInfoField(lines, fieldLabel, value) {
  const section = findSection(lines, 'Product Info');
  if (!section) return lines;
  const fieldRe = new RegExp('\\*\\*' + fieldLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\*\\*:', 'i');
  for (let i = section.start + 1; i < section.end; i++) {
    if (fieldRe.test(lines[i])) { lines[i] = `- **${fieldLabel}**: ${value}`; return lines; }
  }
  let insertAt = section.start + 1;
  for (let i = section.start + 1; i < section.end; i++) {
    if (/^-\s+\*\*/.test(lines[i])) insertAt = i + 1;
  }
  lines.splice(insertAt, 0, `- **${fieldLabel}**: ${value}`);
  return lines;
}

function readProductInfoField(content, fieldLabel) {
  const re = new RegExp('\\*\\*' + fieldLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\*\\*:\\s*(.*)', 'i');
  const m = content.match(re);
  return m ? m[1].trim() : null;
}

// Runs Log: keep the most recent KEEP_RECENT_RUNS individual rows; roll everything
// older into one summary row and archive the full originals.
function compactRunsLog(lines, product) {
  const range = findTableRange(lines, 'Runs Log');
  if (!range) return 0;
  const allRows = rowsFromRange(lines, range);
  const rollupRows = allRows.filter((r) => r['Phase'] === 'Archived');
  const realRows = allRows.filter((r) => !isPlaceholderRow(r) && r['Phase'] !== 'Archived');
  if (realRows.length <= KEEP_RECENT_RUNS) return 0;

  const toArchive = realRows.slice(0, realRows.length - KEEP_RECENT_RUNS);
  const toKeep = realRows.slice(realRows.length - KEEP_RECENT_RUNS);

  appendHistory(
    product, 'runs-archive.md',
    `# Runs Log Archive — ${product}\nFull rows rolled out of context.md by qa-toolkit.cjs compact-context, oldest first. Nothing here is deleted.\n\n` +
    `| ${range.headers.join(' | ')} |\n|${range.headers.map(() => '---').join('|')}|\n`,
    toArchive.map((r) => renderRow(range.headers, r)).join('\n') + '\n'
  );

  const dates = toArchive.map((r) => r['Date']).filter(Boolean).sort();
  const tally = { pass: 0, fail: 0, partial: 0, other: 0 };
  toArchive.forEach((r) => {
    const o = (r['Outcome'] || '').toLowerCase();
    if (o.includes('fail') || o.includes('bugs found')) tally.fail++;
    else if (o.includes('partial')) tally.partial++;
    else if (o.includes('pass')) tally.pass++;
    else tally.other++;
  });
  const reuseVals = toArchive.map((r) => parseFloat((r['Reuse %'] || '').replace('%', ''))).filter((v) => !isNaN(v));
  const avgReuse = reuseVals.length ? Math.round(reuseVals.reduce((a, b) => a + b, 0) / reuseVals.length) : null;
  const bugsSum = toArchive.reduce((sum, r) => sum + bugsFiledCount(r), 0);
  const rollup = {
    Date: `${dates[0] || '—'} .. ${dates[dates.length - 1] || '—'}`,
    Card: '—',
    Phase: 'Archived',
    Outcome: `${toArchive.length} runs (${tally.pass} Pass / ${tally.fail} Fail / ${tally.partial} Partial${tally.other ? ` / ${tally.other} other` : ''})`,
    'Bugs Filed': String(bugsSum),
    'Reuse %': avgReuse !== null ? `${avgReuse}%` : '—',
    Notes: 'archived → history/runs-archive.md',
  };
  const newDataLines = [...rollupRows.map((r) => renderRow(range.headers, r)), renderRow(range.headers, rollup), ...toKeep.map((r) => renderRow(range.headers, r))];
  lines.splice(range.dataStart, range.dataEnd - range.dataStart, ...newDataLines);
  return toArchive.length;
}

// Known Bugs: open bugs are never archived (still actionable, still needed for
// dup-bug matching). Closed/Done/Resolved/Fixed rows beyond KEEP_RECENT_CLOSED_BUGS
// get archived, oldest first.
function compactKnownBugs(lines, product) {
  const range = findTableRange(lines, 'Known Bugs');
  if (!range) return 0;
  const allRows = rowsFromRange(lines, range);
  const isClosed = (r) => /closed|done|fixed|resolved/i.test(r['Status'] || '');
  // A prior compaction's own summary row (Status: Archived, Bug ID "—") must be pulled
  // out of `allRows` directly — its Bug ID of "—" would otherwise match
  // isPlaceholderRow's empty-table heuristic and get silently dropped (not merged, not
  // counted) rather than folded into this round's total.
  const isSummary = (r) => r['Status'] === 'Archived';
  const priorSummary = allRows.find(isSummary);
  const priorCountMatch = priorSummary ? (priorSummary['Title'] || '').match(/^(\d+)/) : null;
  const priorCount = priorCountMatch ? parseInt(priorCountMatch[1], 10) : 0;
  const realRows = allRows.filter((r) => !isPlaceholderRow(r) && !isSummary(r));
  const open = realRows.filter((r) => !isClosed(r));
  const closed = realRows.filter((r) => isClosed(r));
  if (closed.length <= KEEP_RECENT_CLOSED_BUGS) return 0;

  const toArchive = closed.slice(0, closed.length - KEEP_RECENT_CLOSED_BUGS);
  const toKeep = closed.slice(closed.length - KEEP_RECENT_CLOSED_BUGS);

  appendHistory(
    product, 'bugs-archive.md',
    `# Known Bugs Archive — ${product}\nClosed bugs rolled out of context.md by qa-toolkit.cjs compact-context, oldest first. Nothing here is deleted.\n\n` +
    `| ${range.headers.join(' | ')} |\n|${range.headers.map(() => '---').join('|')}|\n`,
    toArchive.map((r) => renderRow(range.headers, r)).join('\n') + '\n'
  );

  const summaryRow = {
    'Bug ID': '—', Title: `${priorCount + toArchive.length} older closed bug(s) archived`,
    Severity: '—', Status: 'Archived', Card: 'see history/bugs-archive.md',
  };
  const newDataLines = [...open.map((r) => renderRow(range.headers, r)), renderRow(range.headers, summaryRow), ...toKeep.map((r) => renderRow(range.headers, r))];
  lines.splice(range.dataStart, range.dataEnd - range.dataStart, ...newDataLines);
  return toArchive.length;
}

// Element Selectors / Covered Flows: the append-if-new write-back logic elsewhere
// in the pack can still leave stale duplicate rows behind (e.g. a selector for the
// same element/page recorded twice under slightly different runs). Dedupe by key,
// last occurrence wins (most recently written = most likely current) — nothing
// worth archiving here, a superseded selector isn't a historical record.
function dedupeTable(lines, headingText, keyFields) {
  const range = findTableRange(lines, headingText);
  if (!range) return 0;
  const allRows = rowsFromRange(lines, range);
  const realRows = allRows.filter((r) => !isPlaceholderRow(r));
  if (!realRows.length) return 0;
  const byKey = new Map();
  realRows.forEach((r) => byKey.set(keyFields.map((k) => (r[k] || '').toLowerCase()).join('|||'), r));
  const deduped = [...byKey.values()];
  const removed = realRows.length - deduped.length;
  if (!removed) return 0;
  lines.splice(range.dataStart, range.dataEnd - range.dataStart, ...deduped.map((r) => renderRow(range.headers, r)));
  return removed;
}

// Environment Notes is freeform bullet text, not a table — keep the most recent
// KEEP_RECENT_ENV_NOTES lines, archive the rest verbatim.
function compactEnvironmentNotes(lines, product) {
  const section = findSection(lines, 'Environment Notes');
  if (!section) return 0;
  // A prior compaction's own summary line ("- (N older note(s) archived...)") must not
  // be counted as a note itself, or it gets re-archived and its count re-added every
  // subsequent compaction — merge into it instead of stacking or double-counting.
  const summaryRe = /^-\s+\((\d+)\s+older note\(s\) archived/i;
  let existingSummaryIdx = -1;
  let existingSummaryCount = 0;
  const bodyIdx = [];
  for (let i = section.start + 1; i < section.end; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('{')) continue;
    const m = trimmed.match(summaryRe);
    if (m) { existingSummaryIdx = i; existingSummaryCount = parseInt(m[1], 10) || 0; continue; }
    bodyIdx.push(i);
  }
  if (bodyIdx.length <= KEEP_RECENT_ENV_NOTES) return 0;

  const archiveCount = bodyIdx.length - KEEP_RECENT_ENV_NOTES;
  const archiveIdx = bodyIdx.slice(0, archiveCount);
  const archivedText = archiveIdx.map((i) => lines[i]).join('\n');

  appendHistory(
    product, 'environment-notes-archive.md',
    `# Environment Notes Archive — ${product}\nOlder notes rolled out of context.md by qa-toolkit.cjs compact-context. Nothing here is deleted.\n\n`,
    archivedText + '\n'
  );

  const summaryLine = `- (${existingSummaryCount + archiveCount} older note(s) archived — see history/environment-notes-archive.md)`;
  const newLines = [];
  for (let i = section.start; i < section.end; i++) {
    if (archiveIdx.includes(i) || i === existingSummaryIdx) continue;
    newLines.push(lines[i]);
    if (i === section.start) newLines.push(summaryLine);
  }
  lines.splice(section.start, section.end - section.start, ...newLines);
  return archiveCount;
}

function cmdCompactContext(args) {
  requireArgs(args, ['product']);
  const file = contextFile(args.product);
  const content = readFileSafe(file);
  if (content === null) return console.log('NO_CONTEXT_FILE');

  let lines = content.split('\n');
  const prevCount = parseInt(readProductInfoField(content, 'Runs Since Compaction') || '0', 10) || 0;
  const count = args.force ? COMPACT_EVERY_N_RUNS : prevCount + 1;

  if (count < COMPACT_EVERY_N_RUNS) {
    lines = upsertProductInfoField(lines, 'Runs Since Compaction', String(count));
    fs.writeFileSync(file, lines.join('\n'));
    return console.log(`NOT_DUE (${count}/${COMPACT_EVERY_N_RUNS})`);
  }

  const archivedRuns = compactRunsLog(lines, args.product);
  const archivedBugs = compactKnownBugs(lines, args.product);
  const dedupedSelectors = dedupeTable(lines, 'Element Selectors', ['Element Label', 'Page URL']);
  const dedupedFlows = dedupeTable(lines, 'Covered Flows', ['Flow']);
  const archivedNotes = compactEnvironmentNotes(lines, args.product);

  lines = upsertProductInfoField(lines, 'Runs Since Compaction', '0');
  lines = upsertProductInfoField(lines, 'Last Compacted', todayStr());
  fs.writeFileSync(file, lines.join('\n'));

  const parts = [];
  if (archivedRuns) parts.push(`${archivedRuns} run(s)`);
  if (archivedBugs) parts.push(`${archivedBugs} closed bug(s)`);
  if (dedupedSelectors) parts.push(`${dedupedSelectors} duplicate selector(s)`);
  if (dedupedFlows) parts.push(`${dedupedFlows} duplicate flow(s)`);
  if (archivedNotes) parts.push(`${archivedNotes} old note(s)`);

  if (!parts.length) return console.log('COMPACTED — nothing over the keep-window yet, counter reset.');
  console.log(`COMPACTED — ${parts.join(', ')} moved to product_context/${args.product}/history/.`);
}

// ── shared stats collector (dashboard / digest / roi) ─────────────────────

function pctList(rows, field) {
  return rows.map((r) => parseFloat((r[field] || '').replace('%', ''))).filter((v) => !isNaN(v));
}
function avg(nums) {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}
function bugsFiledCount(row) {
  const bf = (row['Bugs Filed'] || '').trim();
  return !bf || bf === '—' ? 0 : bf.split(',').filter(Boolean).length;
}

function collectProductStats(product) {
  const info = getProductInfo(product);
  const runs = getTable(product, 'Runs Log').rows;
  const bugs = getTable(product, 'Known Bugs').rows;
  const flows = getTable(product, 'Covered Flows').rows;
  const openBugs = bugs.filter((b) => !/closed|done|fixed|resolved/i.test(b['Status'] || '')).length;
  return {
    product,
    name: info.name || product,
    env: info.env || '—',
    runCount: runs.length,
    bugCount: bugs.length,
    openBugs,
    flowCount: flows.length,
    avgReuse: avg(pctList(runs, 'Reuse %')),
    lastRun: runs.length ? runs[runs.length - 1] : null,
    runs,
  };
}

// ── dashboard: product health dashboard ───────────────────────────────────

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function cmdDashboard(args) {
  const products = listProductFolders();
  if (!products.length) {
    if (args && args.json) return console.log(JSON.stringify({ products: 0, totalRuns: 0, totalOpenBugs: 0, repos: [] }));
    return console.log('NO_PRODUCTS — no product has run yet.');
  }
  const stats = products.map(collectProductStats).sort((a, b) => b.runCount - a.runCount);
  const totalRuns = stats.reduce((a, s) => a + s.runCount, 0);
  const totalOpenBugs = stats.reduce((a, s) => a + s.openBugs, 0);

  const rows = stats.map((s) => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.env)}</td>
      <td class="num">${s.runCount}</td>
      <td class="num">${s.avgReuse !== null ? s.avgReuse + '%' : '—'}</td>
      <td class="num">${s.flowCount}</td>
      <td class="num ${s.openBugs > 0 ? 'warn' : ''}">${s.openBugs} / ${s.bugCount}</td>
      <td>${s.lastRun ? escapeHtml(s.lastRun['Date'] + ' · ' + s.lastRun['Card']) : '—'}</td>
    </tr>`).join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>QA Product Health Dashboard</title>
<style>
  :root{ --bg:#f4f5f2; --panel:#fff; --ink:#1c2420; --muted:#5b6659; --line:#dfe3d8; --warn:#a6472b; }
  @media (prefers-color-scheme: dark){ :root{ --bg:#12160f; --panel:#181f16; --ink:#e8ece2; --muted:#93998c; --line:#2b342a; --warn:#e08767; } }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;padding:2.5rem 1.5rem}
  .wrap{max-width:980px;margin:0 auto}
  h1{font-size:1.5rem;margin:0 0 .25rem}
  .meta{color:var(--muted);font-size:.85rem;margin-bottom:1.75rem}
  .stats{display:flex;gap:1rem;margin-bottom:1.75rem;flex-wrap:wrap}
  .stat{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:.85rem 1.1rem;min-width:140px}
  .stat b{display:block;font-size:1.4rem} .stat span{color:var(--muted);font-size:.78rem;text-transform:uppercase;letter-spacing:.04em}
  table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:6px;overflow:hidden}
  th,td{padding:.6rem .8rem;border-bottom:1px solid var(--line);text-align:left;font-size:.88rem}
  th{font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
  td.num{font-variant-numeric:tabular-nums;text-align:right} td.warn{color:var(--warn);font-weight:600}
  tr:last-child td{border-bottom:none}
  .wrap{overflow-x:auto}
</style></head>
<body><div class="wrap">
  <h1>QA Product Health Dashboard</h1>
  <div class="meta">Generated ${todayStr()} from ${products.length} product context file(s)</div>
  <div class="stats">
    <div class="stat"><b>${products.length}</b><span>Products</span></div>
    <div class="stat"><b>${totalRuns}</b><span>Total runs</span></div>
    <div class="stat"><b>${totalOpenBugs}</b><span>Open bugs</span></div>
  </div>
  <table>
    <thead><tr><th>Product</th><th>Env</th><th>Runs</th><th>Avg reuse</th><th>Flows covered</th><th>Open / total bugs</th><th>Last run</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div></body></html>`;

  ensureDir(OUTPUTS_DIR);
  fs.writeFileSync(path.join(OUTPUTS_DIR, 'dashboard.html'), html);

  if (args && args.json) {
    console.log(JSON.stringify({
      products: products.length,
      totalRuns,
      totalOpenBugs,
      htmlPath: 'outputs/dashboard.html',
      repos: stats.map((s) => ({
        product: s.product, name: s.name, env: s.env, runCount: s.runCount,
        avgReuse: s.avgReuse, flowCount: s.flowCount, openBugs: s.openBugs, bugCount: s.bugCount,
        lastRunDate: s.lastRun ? s.lastRun['Date'] : null, lastRunCard: s.lastRun ? s.lastRun['Card'] : null,
      })),
    }));
    return;
  }
  console.log(`Dashboard saved: outputs/dashboard.html (${products.length} products, ${totalRuns} runs, ${totalOpenBugs} open bugs)`);
}

// ── digest: QA weekly digest ───────────────────────────────────────────────

function withinDays(dateStr, days) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

function cmdDigest(args) {
  const days = parseInt(args.days, 10) || 7;
  const products = listProductFolders();
  if (!products.length) {
    if (args && args.json) return console.log(JSON.stringify({ days, totalRuns: 0, totalBugs: 0, activeProducts: 0, totalProducts: 0, products: [] }));
    return console.log('NO_PRODUCTS');
  }

  let totalRuns = 0;
  let totalBugs = 0;
  const sections = [];
  const productsOut = [];
  for (const product of products) {
    const info = getProductInfo(product);
    const runs = getTable(product, 'Runs Log').rows.filter((r) => withinDays(r['Date'], days));
    if (!runs.length) continue;
    totalRuns += runs.length;
    const bugsFiled = runs.reduce((sum, r) => sum + bugsFiledCount(r), 0);
    totalBugs += bugsFiled;
    const avgReuse = avg(pctList(runs, 'Reuse %'));
    const cards = runs.map((r) => r['Card']);
    sections.push(
      `### ${info.name || product}\n- Runs: ${runs.length} (${cards.join(', ')})\n` +
      `- Bugs filed: ${bugsFiled}\n- Avg reuse: ${avgReuse !== null ? avgReuse + '%' : 'n/a'}\n`
    );
    productsOut.push({ product, name: info.name || product, runCount: runs.length, cards, bugsFiled, avgReuse });
  }

  const today = todayStr();
  const md =
    `# QA Weekly Digest — ${today}\n` +
    `Window: last ${days} day(s) · ${sections.length}/${products.length} product(s) active\n\n` +
    `**Totals:** ${totalRuns} run(s) · ${totalBugs} bug(s) filed\n\n` +
    (sections.length ? sections.join('\n') : '_No runs recorded in this window._\n');

  ensureDir(OUTPUTS_DIR);
  const file = path.join(OUTPUTS_DIR, `qa-weekly-digest-${today}.md`);
  fs.writeFileSync(file, md);

  if (args && args.json) {
    console.log(JSON.stringify({
      days, totalRuns, totalBugs,
      activeProducts: sections.length, totalProducts: products.length,
      mdPath: `outputs/qa-weekly-digest-${today}.md`,
      products: productsOut,
    }));
    return;
  }
  console.log(
    `Digest saved: outputs/qa-weekly-digest-${today}.md — ${totalRuns} runs, ${totalBugs} bugs across ` +
    `${sections.length} active product(s) in the last ${days} days.`
  );
}

// ── roi: token-spend / ROI view ────────────────────────────────────────────

function cmdRoi(args) {
  const products = listProductFolders();
  if (!products.length) {
    if (args && args.json) return console.log(JSON.stringify({ totalRuns: 0, totalBugs: 0, hasTracking: false, rows: [] }));
    return console.log('NO_PRODUCTS');
  }

  const tracking = tryReadTrackingLog();
  const hasTracking = Array.isArray(tracking) && tracking.length > 0;

  const rowsOut = [];
  let totalRuns = 0;
  let totalBugs = 0;
  let totalTokens = 0;
  let tokenRuns = 0;

  for (const product of products) {
    const runs = getTable(product, 'Runs Log').rows;
    if (!runs.length) continue;
    totalRuns += runs.length;
    const bugsFiled = runs.reduce((sum, r) => sum + bugsFiledCount(r), 0);
    totalBugs += bugsFiled;
    const avgReuse = avg(pctList(runs, 'Reuse %'));

    let avgTokens = null;
    if (hasTracking) {
      const cardIds = new Set(runs.map((r) => r['Card']));
      const entries = tracking.filter((e) => e && cardIds.has(e.card));
      const totals = entries.map((e) => (e.input_tokens || 0) + (e.output_tokens || 0)).filter((v) => v > 0);
      if (totals.length) {
        avgTokens = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
        totalTokens += totals.reduce((a, b) => a + b, 0);
        tokenRuns += totals.length;
      }
    }
    rowsOut.push({ product, runs: runs.length, bugsFiled, avgReuse, avgTokens });
  }

  const today = todayStr();
  let md = `# QA Token-Spend / ROI View — ${today}\n\n`;
  md += `| Product | Runs | Bugs found | Avg reuse | Avg tokens/run | Bugs per 1k tokens |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const r of rowsOut) {
    const bugsPer1k = r.avgTokens && r.bugsFiled ? ((r.bugsFiled / r.runs) / (r.avgTokens / 1000)).toFixed(2) : '—';
    md += `| ${r.product} | ${r.runs} | ${r.bugsFiled} | ${r.avgReuse !== null ? r.avgReuse + '%' : '—'} | ` +
      `${r.avgTokens !== null ? r.avgTokens.toLocaleString() : '—'} | ${bugsPer1k} |\n`;
  }
  md += `\n**Totals:** ${totalRuns} runs · ${totalBugs} bugs found`;
  if (hasTracking && tokenRuns) {
    md += ` · ${Math.round(totalTokens / tokenRuns).toLocaleString()} avg tokens/run across ${tokenRuns} tracked run(s)\n`;
  } else {
    md += `\n\n_Token columns require \`QA_TRACKING_DIR\` set in \`.env\` with an active token tracker — ` +
      `showing coverage/bug metrics only until then._\n`;
  }

  ensureDir(OUTPUTS_DIR);
  fs.writeFileSync(path.join(OUTPUTS_DIR, 'roi-report.md'), md);

  if (args && args.json) {
    console.log(JSON.stringify({
      totalRuns, totalBugs, hasTracking,
      avgTokensPerRun: hasTracking && tokenRuns ? Math.round(totalTokens / tokenRuns) : null,
      mdPath: 'outputs/roi-report.md',
      rows: rowsOut,
    }));
    return;
  }
  console.log(
    `ROI report saved: outputs/roi-report.md — ${totalRuns} runs, ${totalBugs} bugs` +
    `${hasTracking ? ', token data included' : ' (token data unavailable — set QA_TRACKING_DIR to enable)'}.`
  );
}

// ── search: grep across every product's context tables ───────────────────

const SEARCHABLE_TABLES = [
  ['bugs', 'Known Bugs'],
  ['flows', 'Covered Flows'],
  ['selectors', 'Element Selectors'],
  ['runs', 'Runs Log'],
];

function cmdSearch(args) {
  requireArgs(args, ['query']);
  const needle = String(args.query).toLowerCase();
  const products = args.product ? [args.product] : listProductFolders();
  const matches = [];
  for (const product of products) {
    for (const [, heading] of SEARCHABLE_TABLES) {
      for (const row of getTable(product, heading).rows) {
        const cells = Object.values(row);
        if (cells.join(' ').toLowerCase().includes(needle)) matches.push({ product, table: heading, cells });
      }
    }
  }
  if (args.json) return console.log(JSON.stringify({ matches }));
  if (!products.length) return console.log('NO_PRODUCTS');
  if (!matches.length) return console.log('NO_MATCHES');
  matches.forEach((m) => console.log([m.product, m.table, ...m.cells].join(' | ')));
}

// ── export: context tables as CSV / JSON for reporting outside Claude ────

function csvCell(v) {
  const s = String(v === undefined || v === null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function cmdExport(args) {
  const tableKey = args.table || 'runs';
  const entry = SEARCHABLE_TABLES.find(([key]) => key === tableKey);
  if (!entry) return console.log(`ERROR: --table must be one of ${SEARCHABLE_TABLES.map(([k]) => k).join(', ')}`);
  const format = args.format || 'csv';
  if (format !== 'csv' && format !== 'json') return console.log('ERROR: --format must be csv or json');
  const products = args.product ? [args.product] : listProductFolders();
  if (!products.length) return console.log(args.json ? JSON.stringify({ rows: 0, path: null }) : 'NO_PRODUCTS');

  const rows = [];
  for (const product of products) {
    for (const row of getTable(product, entry[1]).rows) rows.push({ Product: product, ...row });
  }
  if (!rows.length) return console.log(args.json ? JSON.stringify({ rows: 0, path: null }) : 'NO_ROWS');

  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const body = format === 'json'
    ? JSON.stringify(rows, null, 2) + '\n'
    : [headers.map(csvCell).join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\n') + '\n';

  ensureDir(OUTPUTS_DIR);
  const outPath = args.out && args.out !== true ? path.resolve(ROOT, args.out) : path.join(OUTPUTS_DIR, `qa-export-${tableKey}.${format}`);
  fs.writeFileSync(outPath, body);
  if (args.json) return console.log(JSON.stringify({ rows: rows.length, path: path.relative(ROOT, outPath) }));
  console.log(`Exported ${rows.length} ${tableKey} row(s) → ${path.relative(ROOT, outPath)}`);
}

// ── doctor: is this repo actually ready to run the QA agent? ─────────────

const REQUIRED_ENV_KEYS = ['QA_APP_URL', 'QA_LOGIN_URL', 'QA_USERNAME', 'QA_PASSWORD'];
const REQUIRED_CONTEXT_SECTIONS = ['Product Info', 'Runs Log', 'Known Bugs', 'Covered Flows', 'Element Selectors', 'Environment Notes'];

function cmdDoctor(args) {
  const checks = [];
  const add = (level, name, detail) => checks.push({ level, name, detail });

  const envRaw = readFileSafe(path.join(ROOT, '.env'));
  if (envRaw === null) {
    add('FAIL', '.env', 'missing — copy .env.example and fill it in');
  } else {
    const values = {};
    for (const line of envRaw.split(/\r?\n/)) {
      const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (m) values[m[1]] = m[2].trim().replace(/^(["'])(.*)\1$/, '$2');
    }
    const empty = REQUIRED_ENV_KEYS.filter((k) => !values[k]);
    if (empty.length) add('WARN', '.env', `empty: ${empty.join(', ')}`);
    else add('OK', '.env', 'required keys filled in');
  }

  const mcpRaw = readFileSafe(path.join(ROOT, '.mcp.json'));
  if (mcpRaw === null) {
    add('FAIL', '.mcp.json', 'missing — Playwright MCP is not configured');
  } else {
    try {
      const servers = Object.keys((JSON.parse(mcpRaw).mcpServers) || {});
      if (servers.some((n) => /playwright/i.test(n))) add('OK', '.mcp.json', 'Playwright MCP configured');
      else add('FAIL', '.mcp.json', 'no Playwright MCP server entry');
    } catch {
      add('FAIL', '.mcp.json', 'not valid JSON');
    }
  }

  add(fs.existsSync(path.join(ROOT, 'CLAUDE.md')) ? 'OK' : 'WARN', 'CLAUDE.md', fs.existsSync(path.join(ROOT, 'CLAUDE.md')) ? 'present' : 'missing — project facts (Jira key, environment) are unset');

  const ctx = readFileSafe(path.join(ROOT, '.claude', 'skills', 'SKILLS_CONTEXT.md'));
  const ver = ctx && /pack version[^0-9]*([0-9]+\.[0-9]+\.[0-9]+)/i.exec(ctx);
  add(ver ? 'OK' : 'WARN', 'pack version', ver ? ver[1] : 'could not read a version stamp from SKILLS_CONTEXT.md');

  for (const product of listProductFolders()) {
    const content = readFileSafe(contextFile(product)) || '';
    const missing = REQUIRED_CONTEXT_SECTIONS.filter((h) => !extractSectionLines(content, h));
    add(missing.length ? 'WARN' : 'OK', `context: ${product}`, missing.length ? `missing section(s): ${missing.join(', ')}` : 'all sections present');
  }

  const failed = checks.some((c) => c.level === 'FAIL');
  if (args.json) console.log(JSON.stringify({ ok: !failed, checks }));
  else checks.forEach((c) => console.log(`${c.level} ${c.name} — ${c.detail}`));
  if (failed) process.exitCode = 1;
}

// ── dispatch ────────────────────────────────────────────────────────────

function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);
  const handlers = {
    'list-products': cmdListProducts,
    'get-bugs': cmdGetBugs,
    'get-runs': cmdGetRuns,
    'get-selectors': cmdGetSelectors,
    fingerprint: cmdFingerprint,
    'pii-scan': cmdPiiScan,
    'dup-bug': cmdDupBug,
    'cost-estimate': cmdCostEstimate,
    'risk-score': cmdRiskScore,
    'trust-record': cmdTrustRecord,
    'trust-status': cmdTrustStatus,
    'locator-record': cmdLocatorRecord,
    'locator-query': cmdLocatorQuery,
    'compact-context': cmdCompactContext,
    dashboard: cmdDashboard,
    digest: cmdDigest,
    roi: cmdRoi,
    search: cmdSearch,
    export: cmdExport,
    doctor: cmdDoctor,
  };
  const handler = handlers[command];
  if (!handler) {
    console.log(
      'Usage: qa-toolkit.cjs <command> [--flags]\n' +
      'Commands: list-products, get-bugs, get-runs, get-selectors, fingerprint, pii-scan, dup-bug,\n' +
      '          cost-estimate, risk-score, trust-record, trust-status,\n' +
      '          locator-record, locator-query, compact-context, dashboard, digest, roi,\n' +
      '          search, export, doctor'
    );
    process.exit(command ? 1 : 0);
  }
  Promise.resolve(handler(args)).catch(() => {});
}

main();
