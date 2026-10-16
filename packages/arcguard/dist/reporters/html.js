"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlReport = htmlReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function htmlReport(result, _projectRoot, outputPath) {
    const dir = path_1.default.dirname(outputPath);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    const reportData = buildReportData(result);
    const projectName = path_1.default.basename(result.scanResult.projectRoot) || result.scanResult.projectRoot;
    const safeJson = safeJsonStringify(reportData);
    const html = buildHtml(projectName, safeJson);
    fs_1.default.writeFileSync(outputPath, html, 'utf-8');
    console.log(`[arcguard] HTML report written to ${outputPath}`);
}
function buildReportData(result) {
    const { files, dependencyGraph } = result.scanResult;
    const componentReuse = files
        .filter(f => /\.[jt]sx$/.test(f.path) && !/(\.test\.|\.spec\.|\.stories\.)/i.test(f.path))
        .map(f => ({
        relativePath: f.relativePath,
        consumers: dependencyGraph.reverseEdges.get(f.path)?.size ?? 0,
    }))
        .sort((a, b) => b.consumers - a.consumers);
    // ── Dependency graph (cap at 300 for O(n²) force-sim perf) ────────────────
    const MAX_GRAPH_NODES = 300;
    const violsByFile = {};
    for (const v of result.violations)
        violsByFile[v.filePath] = (violsByFile[v.filePath] ?? 0) + 1;
    const LAYER_SEGS = new Set(['presentation', 'application', 'domain', 'infrastructure', 'shared']);
    const connected = new Set();
    for (const [src, targets] of dependencyGraph.edges) {
        if (targets.size > 0) {
            connected.add(src);
            for (const t of targets)
                connected.add(t);
        }
    }
    for (const v of result.violations)
        connected.add(v.filePath);
    const nodeList = [...connected]
        .sort((a, b) => {
        const deg = (f) => (dependencyGraph.edges.get(f)?.size ?? 0) + (dependencyGraph.reverseEdges.get(f)?.size ?? 0);
        return (deg(b) + (violsByFile[b] ?? 0) * 2) - (deg(a) + (violsByFile[a] ?? 0) * 2);
    })
        .slice(0, MAX_GRAPH_NODES);
    const nodeSet = new Set(nodeList);
    const root = result.scanResult.projectRoot;
    const depNodes = nodeList.map(f => {
        const rel = path_1.default.relative(root, f).replace(/\\/g, '/');
        const segs = rel.split('/');
        const dIdx = segs.indexOf('domains');
        return {
            id: f,
            label: path_1.default.basename(f),
            rel,
            domain: dIdx >= 0 ? (segs[dIdx + 1] ?? '') : '',
            layer: segs.find(s => LAYER_SEGS.has(s)) ?? '',
            violations: violsByFile[f] ?? 0, // filePath-keyed
            degree: (dependencyGraph.edges.get(f)?.size ?? 0) + (dependencyGraph.reverseEdges.get(f)?.size ?? 0),
        };
    });
    const depEdges = [];
    for (const [src, targets] of dependencyGraph.edges) {
        if (!nodeSet.has(src))
            continue;
        for (const tgt of targets) {
            if (nodeSet.has(tgt))
                depEdges.push({ source: src, target: tgt });
        }
    }
    return {
        schemaVersion: '2.0',
        generatedAt: new Date().toISOString(),
        projectRoot: result.scanResult.projectRoot,
        duration: result.duration,
        summary: result.summary,
        healthScore: result.healthScore,
        reusabilityScore: result.reusabilityScore,
        componentReuse,
        depGraph: { nodes: depNodes, edges: depEdges },
        violations: result.violations.map(v => ({
            ruleId: v.ruleId,
            ruleName: v.ruleName,
            severity: v.severity,
            category: v.category,
            message: v.message,
            relativePath: v.relativePath,
            line: v.line,
            column: v.column,
            suggestion: v.suggestion,
        })),
    };
}
function safeJsonStringify(data) {
    return JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');
}
// ── CSS (dark theme default, light theme via prefers-color-scheme) ─────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f172a;--card:#1e293b;--card2:#263348;
  --text:#e2e8f0;--text-muted:#94a3b8;--border:#334155;
  --error:#f87171;--warning:#fbbf24;--info:#60a5fa;--success:#4ade80;
  --accent:#818cf8;--accent-glow:rgba(129,140,248,.15);
  --radius:10px;
}
@media(prefers-color-scheme:light){
  :root{
    --bg:#f1f5f9;--card:#fff;--card2:#f8fafc;
    --text:#0f172a;--text-muted:#64748b;--border:#e2e8f0;
    --error:#dc2626;--warning:#d97706;--info:#2563eb;--success:#16a34a;
    --accent:#4f46e5;--accent-glow:rgba(79,70,229,.1);
  }
}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);
  color:var(--text);min-height:100vh;font-size:14px}
.header{position:sticky;top:0;z-index:10;background:var(--card);
  border-bottom:1px solid var(--border);display:flex;align-items:center;
  justify-content:space-between;padding:.875rem 2rem;gap:1rem}
.logo{font-size:1.375rem;font-weight:800;letter-spacing:-.02em;color:var(--accent);flex-shrink:0}
.logo span{color:var(--text-muted);font-weight:400}
.header-meta{display:flex;flex-direction:column;align-items:flex-end;gap:.125rem}
.project-name{font-family:'SFMono-Regular',Consolas,monospace;font-size:.85rem;font-weight:600}
.header-detail{font-size:.75rem;color:var(--text-muted)}
.summary-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;padding:1.5rem 2rem}
.stat-card{background:var(--card);border:1px solid var(--border);
  border-radius:var(--radius);padding:1.25rem 1.5rem}
.stat-value{font-size:2.25rem;font-weight:700;line-height:1;margin-bottom:.375rem}
.stat-label{font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em}
.stat-error .stat-value{color:var(--error)}
.stat-warning .stat-value{color:var(--warning)}
.main{padding:0 2rem 2rem;display:flex;flex-direction:column;gap:1.25rem}
.section-card{background:var(--card);border:1px solid var(--border);
  border-radius:var(--radius);overflow:hidden}
.section-header{padding:.75rem 1.5rem;border-bottom:1px solid var(--border);
  font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted)}
.chart-body{padding:1.25rem 1.5rem}
.bar-row{display:flex;align-items:center;gap:1rem;margin-bottom:.75rem}
.bar-row:last-child{margin-bottom:0}
.bar-label{width:100px;font-size:.78rem;color:var(--text-muted);
  text-align:right;flex-shrink:0;text-transform:capitalize}
.bar-track{flex:1;height:16px;background:var(--card2);border-radius:4px;
  overflow:hidden;border:1px solid var(--border)}
.bar-fill{height:100%;display:flex;transition:width .4s ease}
.bar-segment{height:100%}
.bar-count{width:32px;text-align:right;font-size:.78rem;color:var(--text-muted);flex-shrink:0}
.toolbar{display:flex;align-items:center;gap:.625rem;padding:.875rem 1.5rem;
  border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--card2)}
.filter-btn{border:1px solid var(--border);background:transparent;color:var(--text-muted);
  padding:.3rem .75rem;border-radius:6px;font-size:.78rem;cursor:pointer;
  font-family:inherit;transition:all .15s;line-height:1.4}
.filter-btn:hover{border-color:var(--accent);color:var(--text)}
.filter-btn.active{background:var(--accent-glow);border-color:var(--accent);
  color:var(--accent);font-weight:600}
.filter-btn.active.btn-error{background:rgba(248,113,113,.1);
  border-color:var(--error);color:var(--error)}
.filter-btn.active.btn-warning{background:rgba(251,191,36,.1);
  border-color:var(--warning);color:var(--warning)}
.filter-btn.active.btn-info{background:rgba(96,165,250,.1);
  border-color:var(--info);color:var(--info)}
.category-select{border:1px solid var(--border);background:var(--card);
  color:var(--text);padding:.3rem .625rem;border-radius:6px;font-size:.78rem;
  font-family:inherit;outline:none;cursor:pointer}
.category-select:focus{border-color:var(--accent)}
.result-count{margin-left:auto;font-size:.78rem;color:var(--text-muted)}
.file-group{border-bottom:1px solid var(--border)}
.file-group:last-child{border-bottom:none}
.file-header{display:flex;align-items:center;gap:.75rem;padding:.75rem 1.5rem;
  cursor:pointer;user-select:none;transition:background .1s}
.file-header:hover{background:var(--card2)}
.toggle-icon{color:var(--text-muted);font-size:.65rem;flex-shrink:0;
  display:inline-block;width:12px;transition:transform .2s;line-height:1}
.toggle-icon.open{transform:rotate(90deg)}
.file-path{font-family:'SFMono-Regular',Consolas,monospace;font-size:.78rem;
  flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.file-count-badge{font-size:.68rem;font-weight:700;padding:2px 8px;
  border-radius:10px;flex-shrink:0}
.badge-error{background:rgba(248,113,113,.15);color:var(--error)}
.badge-warning{background:rgba(251,191,36,.15);color:var(--warning)}
.badge-info{background:rgba(96,165,250,.15);color:var(--info)}
.violation{display:flex;align-items:flex-start;gap:.625rem;
  padding:.625rem 1.5rem .625rem 2.5rem;border-top:1px solid var(--border);
  transition:background .1s}
.violation:hover{background:var(--card2)}
.sev-badge{font-size:.62rem;font-weight:700;padding:2px 6px;border-radius:4px;
  text-transform:uppercase;letter-spacing:.04em;flex-shrink:0;margin-top:2px}
.sev-error{background:rgba(248,113,113,.15);color:var(--error)}
.sev-warning{background:rgba(251,191,36,.15);color:var(--warning)}
.sev-info{background:rgba(96,165,250,.15);color:var(--info)}
.rule-id{font-family:'SFMono-Regular',Consolas,monospace;font-size:.72rem;
  color:var(--text-muted);flex-shrink:0;margin-top:2px;white-space:nowrap}
.line-col{font-family:'SFMono-Regular',Consolas,monospace;font-size:.72rem;
  color:var(--text-muted);flex-shrink:0;margin-top:2px;white-space:nowrap}
.violation-text{flex:1;min-width:0}
.violation-msg{font-size:.84rem;word-break:break-word}
.violation-suggestion{font-size:.76rem;color:var(--accent);margin-top:3px;word-break:break-word}
.empty-state{padding:3rem 2rem;text-align:center;color:var(--text-muted);font-size:.9rem}
.empty-state.success{color:var(--success)}
@media(max-width:700px){
  .summary-strip{grid-template-columns:repeat(2,1fr)}
  .header{flex-direction:column;align-items:flex-start;gap:.5rem}
  .header-meta{align-items:flex-start}
  .bar-label{width:70px;font-size:.72rem}
  .main,.summary-strip{padding-left:1rem;padding-right:1rem}
  .header{padding:.875rem 1rem}
}
.health-panel{display:flex;align-items:stretch;background:var(--card);
  border:1px solid var(--border);overflow:hidden;margin:0 2rem}
.health-overall{display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:1.5rem 2rem;border-right:1px solid var(--border);min-width:180px;gap:.375rem;flex-shrink:0}
.health-score-num{font-size:3.5rem;font-weight:800;line-height:1;letter-spacing:-.03em}
.health-score-denom{font-size:.9rem;color:var(--text-muted);font-weight:400;margin-left:.25rem}
.health-grade-badge{font-size:1.125rem;font-weight:700;padding:.2rem .875rem;
  border-radius:8px;margin-top:.25rem}
.health-label{font-size:.7rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.1em;color:var(--text-muted);margin-top:.25rem}
.gA{color:var(--success)}.gB{color:#86efac}.gC{color:var(--warning)}
.gD{color:#fb923c}.gF{color:var(--error)}
.bgA{background:rgba(74,222,128,.12)}.bgB{background:rgba(134,239,172,.12)}
.bgC{background:rgba(251,191,36,.12)}.bgD{background:rgba(251,146,60,.12)}
.bgF{background:rgba(248,113,113,.12)}
.health-cats{flex:1;padding:1.125rem 1.5rem;display:flex;flex-direction:column;
  justify-content:center;gap:.625rem}
.hcrow{display:flex;align-items:center;gap:.75rem}
.hclabel{width:110px;font-size:.78rem;color:var(--text-muted);flex-shrink:0}
.hctrack{flex:1;height:8px;background:var(--card2);border-radius:4px;
  overflow:hidden;border:1px solid var(--border)}
.hcfill{height:100%;border-radius:4px;transition:width .5s ease}
.hcscore{width:38px;text-align:right;font-size:.78rem;font-weight:600;flex-shrink:0}
.hcgrade{width:18px;text-align:center;font-size:.72rem;font-weight:700;flex-shrink:0}
.hcviol{font-size:.72rem;color:var(--text-muted);flex-shrink:0;min-width:80px}
@media(max-width:700px){
  .health-panel{flex-direction:column;margin:0 1rem}
  .health-overall{border-right:none;border-bottom:1px solid var(--border);
    flex-direction:row;padding:1rem;gap:1rem;min-width:unset}
  .hclabel{width:80px}
}
.cr-path{font-family:'SFMono-Regular',Consolas,monospace;font-size:.72rem;
  width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  flex-shrink:0;color:var(--text-muted);text-align:left}
.cr-badge{font-size:.62rem;font-weight:700;padding:1px 6px;border-radius:3px;flex-shrink:0}
.cr-unused{background:rgba(248,113,113,.12);color:var(--error)}
.cr-single{background:rgba(251,191,36,.1);color:var(--warning)}
.hcrow-expandable{cursor:pointer;user-select:none}
.hcrow-expandable:hover .hclabel{color:var(--text)}
.hc-toggle{font-size:.6rem;color:var(--text-muted);margin-right:.3rem;
  display:inline-block;transition:transform .2s;line-height:1;vertical-align:middle}
.hc-toggle.open{transform:rotate(90deg)}
.hc-subbody{padding:.125rem 0 .375rem 0}
.hc-subrow{display:flex;align-items:center;gap:.75rem;padding:.2rem 0 .2rem 1.75rem}
.hc-sublabel{width:110px;font-size:.72rem;color:var(--text-muted);flex-shrink:0}
.hc-subtrack{flex:1;height:5px;background:var(--card2);border-radius:3px;
  overflow:hidden;border:1px solid var(--border)}
.hc-subfill{height:100%;border-radius:3px;transition:width .5s ease}
.hc-subscore{width:38px;text-align:right;font-size:.72rem;font-weight:600;flex-shrink:0}
.hc-subgrade{width:18px;text-align:center;font-size:.68rem;font-weight:700;flex-shrink:0}
.hc-subdetail{font-size:.68rem;color:var(--text-muted);flex-shrink:0;min-width:70px}
.dep-graph-wrap{position:relative;padding:.75rem 1.5rem 1.25rem;background:var(--card2)}
.dep-canvas{display:block;border-radius:6px;background:var(--bg);border:1px solid var(--border);cursor:grab}
.dep-tooltip{position:absolute;pointer-events:none;display:none;background:var(--card);
  border:1px solid var(--border);border-radius:8px;padding:.5rem .75rem;font-size:.78rem;
  line-height:1.55;box-shadow:0 4px 16px rgba(0,0,0,.4);max-width:260px;word-break:break-all;z-index:20}
.dep-tt-path{opacity:.6;font-family:'SFMono-Regular',Consolas,monospace;font-size:.68rem;display:block}
.dep-tt-deg{opacity:.45;font-size:.68rem}
.dep-legend{display:flex;flex-wrap:wrap;gap:.375rem .625rem;margin-top:.625rem;font-size:.72rem;color:var(--text-muted)}
.dep-leg-item{display:flex;align-items:center;gap:.35rem}
.dep-leg-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.dep-leg-ring{width:10px;height:10px;border-radius:50%;flex-shrink:0;
  background:rgba(248,113,113,.25);box-shadow:0 0 0 2.5px rgba(248,113,113,.55)}
.dep-controls{display:flex;align-items:center;gap:.625rem;margin-bottom:.5rem;flex-wrap:wrap}
.dep-btn{border:1px solid var(--border);background:var(--card);color:var(--text-muted);
  padding:.25rem .625rem;border-radius:5px;font-size:.72rem;cursor:pointer;
  font-family:inherit;line-height:1.4;transition:all .15s}
.dep-btn:hover{border-color:var(--accent);color:var(--text)}
.dep-zoom-lbl{font-size:.72rem;color:var(--text-muted);font-family:'SFMono-Regular',Consolas,monospace;min-width:3rem}
.dep-hint{font-size:.68rem;color:var(--text-muted);opacity:.55;margin-left:auto}
`;
// ── Embedded JS (var declarations, + concatenation only — no template literals)
const JS = `
var state = { severity: 'all', category: 'all' };
var collapsedFiles = {};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getFiltered() {
  return DATA.violations.filter(function(v) {
    if (state.severity !== 'all' && v.severity !== state.severity) return false;
    if (state.category !== 'all' && v.category !== state.category) return false;
    return true;
  });
}

function groupByFile(violations) {
  var result = [], seen = {};
  for (var i = 0; i < violations.length; i++) {
    var v = violations[i];
    if (seen[v.relativePath] === undefined) {
      seen[v.relativePath] = result.length;
      result.push({ path: v.relativePath, items: [] });
    }
    result[seen[v.relativePath]].items.push(v);
  }
  return result;
}

function computeCatSeverity() {
  var out = {};
  for (var i = 0; i < DATA.violations.length; i++) {
    var v = DATA.violations[i];
    if (!out[v.category]) out[v.category] = { error: 0, warning: 0, info: 0 };
    out[v.category][v.severity]++;
  }
  return out;
}

function statCard(label, value, cls) {
  return '<div class="stat-card ' + cls + '">' +
    '<div class="stat-value">' + value + '</div>' +
    '<div class="stat-label">' + label + '</div>' +
    '</div>';
}

function buildHeader() {
  var date = new Date(DATA.generatedAt).toLocaleString();
  var dur = DATA.duration < 1000 ? DATA.duration + 'ms' : (DATA.duration / 1000).toFixed(1) + 's';
  var parts = DATA.projectRoot.replace(/\\\\/g, '/').split('/');
  var name = parts[parts.length - 1] || DATA.projectRoot;
  return '<header class="header">' +
    '<div class="logo">Arc<span>Guard</span></div>' +
    '<div class="header-meta">' +
      '<span class="project-name">' + esc(name) + '</span>' +
      '<span class="header-detail">Generated ' + esc(date) + ' \xb7 ' + esc(dur) + '</span>' +
    '</div>' +
    '</header>';
}

function buildSummary() {
  var s = DATA.summary;
  return '<div class="summary-strip">' +
    statCard('Total Violations', s.total, '') +
    statCard('Errors', s.errors, 'stat-error') +
    statCard('Warnings', s.warnings, 'stat-warning') +
    statCard('Files with Issues', s.filesWithViolations, '') +
    '</div>';
}

function buildCategoryChart() {
  var byCat = DATA.summary.byCategory;
  var cats = Object.keys(byCat).filter(function(c) { return byCat[c] > 0; });
  if (!cats.length) return '';
  cats.sort(function(a, b) { return byCat[b] - byCat[a]; });
  var maxCount = byCat[cats[0]];
  var catSev = computeCatSeverity();
  var rows = '';
  for (var i = 0; i < cats.length; i++) {
    var cat = cats[i];
    var count = byCat[cat];
    var fillPct = (count / maxCount * 100).toFixed(1);
    var sv = catSev[cat] || { error: 0, warning: 0, info: 0 };
    var segs = '';
    if (sv.error)   segs += '<div class="bar-segment" style="width:' + (sv.error   / count * 100).toFixed(1) + '%;background:var(--error);opacity:.75"></div>';
    if (sv.warning) segs += '<div class="bar-segment" style="width:' + (sv.warning / count * 100).toFixed(1) + '%;background:var(--warning);opacity:.75"></div>';
    if (sv.info)    segs += '<div class="bar-segment" style="width:' + (sv.info    / count * 100).toFixed(1) + '%;background:var(--info);opacity:.75"></div>';
    rows += '<div class="bar-row">' +
      '<div class="bar-label">' + esc(cat) + '</div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + fillPct + '%">' + segs + '</div></div>' +
      '<div class="bar-count">' + count + '</div>' +
      '</div>';
  }
  return '<div class="section-card">' +
    '<div class="section-header">By Category</div>' +
    '<div class="chart-body">' + rows + '</div>' +
    '</div>';
}

function buildToolbar(filtered) {
  var byCat = DATA.summary.byCategory;
  var cats = Object.keys(byCat).filter(function(c) { return byCat[c] > 0; });
  var sevs = ['all', 'error', 'warning', 'info'];
  var btns = '';
  for (var i = 0; i < sevs.length; i++) {
    var sv = sevs[i];
    var lbl = sv === 'all' ? 'All' : sv.charAt(0).toUpperCase() + sv.slice(1) + 's';
    var cls = 'filter-btn' + (state.severity === sv ? ' active btn-' + sv : '');
    btns += '<button class="' + cls + '" data-severity="' + sv + '">' + lbl + '</button>';
  }
  var opts = '<option value="all"' + (state.category === 'all' ? ' selected' : '') + '>All categories</option>';
  for (var j = 0; j < cats.length; j++) {
    var cat = cats[j];
    opts += '<option value="' + esc(cat) + '"' + (state.category === cat ? ' selected' : '') + '>' + esc(cat) + '</option>';
  }
  var c = filtered.length;
  return '<div id="toolbar" class="toolbar">' +
    btns +
    '<select id="cat-select" class="category-select">' + opts + '</select>' +
    '<span class="result-count">' + c + ' violation' + (c !== 1 ? 's' : '') + '</span>' +
    '</div>';
}

function buildViolationRow(v) {
  var loc = v.line != null ? (':' + v.line + (v.column != null ? ':' + v.column : '')) : '';
  var sug = v.suggestion ? '<div class="violation-suggestion">→ ' + esc(v.suggestion) + '</div>' : '';
  return '<div class="violation">' +
    '<span class="sev-badge sev-' + v.severity + '">' + v.severity + '</span>' +
    '<span class="rule-id">' + esc(v.ruleId) + '</span>' +
    (loc ? '<span class="line-col">' + esc(loc) + '</span>' : '') +
    '<div class="violation-text"><div class="violation-msg">' + esc(v.message) + '</div>' + sug + '</div>' +
    '</div>';
}

function buildFileGroup(idx, filePath, violations) {
  var id = 'fg-' + idx;
  var isCollapsed = !!collapsedFiles[filePath];
  var hasErr = false, hasWarn = false;
  for (var i = 0; i < violations.length; i++) {
    if (violations[i].severity === 'error') { hasErr = true; break; }
    if (violations[i].severity === 'warning') hasWarn = true;
  }
  var badge = hasErr ? 'badge-error' : (hasWarn ? 'badge-warning' : 'badge-info');
  var rows = '';
  for (var j = 0; j < violations.length; j++) rows += buildViolationRow(violations[j]);
  return '<div class="file-group">' +
    '<div class="file-header" data-file="' + esc(filePath) + '" data-id="' + id + '">' +
      '<span id="' + id + '-icon" class="toggle-icon' + (isCollapsed ? '' : ' open') + '">►</span>' +
      '<span class="file-path">' + esc(filePath) + '</span>' +
      '<span class="file-count-badge ' + badge + '">' + violations.length + '</span>' +
    '</div>' +
    '<div id="' + id + '-body"' + (isCollapsed ? ' style="display:none"' : '') + '>' + rows + '</div>' +
    '</div>';
}

function buildViolationsList(violations) {
  if (!DATA.violations.length)
    return '<div class="empty-state success">✅ No violations found. Architecture looks clean!</div>';
  if (!violations.length)
    return '<div class="empty-state">No violations match the current filters.</div>';
  var groups = groupByFile(violations);
  var html = '';
  for (var i = 0; i < groups.length; i++) html += buildFileGroup(i, groups[i].path, groups[i].items);
  return html;
}

function scoreColor(s) {
  return s >= 90 ? 'var(--success)' : (s >= 80 ? '#86efac' : (s >= 70 ? 'var(--warning)' : (s >= 60 ? '#fb923c' : 'var(--error)')));
}

function buildHealthScore() {
  if (!DATA.healthScore) return '';
  var h = DATA.healthScore;
  var gc = 'g' + h.grade;
  var bc = 'bg' + h.grade;
  var overall = '<div class="health-overall">' +
    '<div class="health-score-num ' + gc + '">' + h.overall +
      '<span class="health-score-denom">/100</span></div>' +
    '<div class="health-grade-badge ' + gc + ' ' + bc + '">' + h.grade + '</div>' +
    '<div class="health-label">Repository Health</div>' +
    '</div>';
  var cats = '';
  for (var i = 0; i < h.categories.length; i++) {
    var cat = h.categories[i];
    var col = scoreColor(cat.score);
    var vs = cat.violations === 0 ? 'clean' : (cat.violations + ' violation' + (cat.violations !== 1 ? 's' : ''));
    if (cat.category === 'reusability' && DATA.reusabilityScore) {
      var rs = DATA.reusabilityScore;
      var subRows = '';
      for (var j = 0; j < rs.metrics.length; j++) {
        var m = rs.metrics[j];
        if (m.total === 0) continue;
        var mc = scoreColor(m.score);
        var mdetail = m.compliant + '/' + m.total;
        subRows += '<div class="hc-subrow">' +
          '<div class="hc-sublabel">' + esc(m.label) + '</div>' +
          '<div class="hc-subtrack"><div class="hc-subfill" style="width:' + m.score + '%;background:' + mc + '"></div></div>' +
          '<div class="hc-subscore" style="color:' + mc + '">' + m.score + '%</div>' +
          '<div class="hc-subgrade" style="color:' + mc + '">' + esc(m.grade) + '</div>' +
          '<div class="hc-subdetail">' + esc(mdetail) + '</div>' +
          '</div>';
      }
      cats += '<div class="hcrow hcrow-expandable" onclick="toggleReusabilitySub()">' +
        '<div class="hclabel"><span id="hc-tog-r" class="hc-toggle">►</span>' + esc(cat.label) + '</div>' +
        '<div class="hctrack"><div class="hcfill" style="width:' + cat.score + '%;background:' + col + '"></div></div>' +
        '<div class="hcscore" style="color:' + col + '">' + cat.score + '%</div>' +
        '<div class="hcgrade" style="color:' + col + '">' + esc(cat.grade) + '</div>' +
        '<div class="hcviol">' + esc(vs) + '</div>' +
        '</div>' +
        '<div id="hc-sub-r" class="hc-subbody" style="display:none">' + subRows + '</div>';
    } else {
      cats += '<div class="hcrow">' +
        '<div class="hclabel">' + esc(cat.label) + '</div>' +
        '<div class="hctrack"><div class="hcfill" style="width:' + cat.score + '%;background:' + col + '"></div></div>' +
        '<div class="hcscore" style="color:' + col + '">' + cat.score + '%</div>' +
        '<div class="hcgrade" style="color:' + col + '">' + esc(cat.grade) + '</div>' +
        '<div class="hcviol">' + esc(vs) + '</div>' +
        '</div>';
    }
  }
  return '<div class="health-panel">' + overall +
    '<div class="health-cats">' + cats + '</div>' +
    '</div>';
}

function toggleReusabilitySub() {
  var sub = document.getElementById('hc-sub-r');
  var tog = document.getElementById('hc-tog-r');
  if (sub && tog) {
    if (sub.style.display === 'none') {
      sub.style.display = '';
      tog.className = 'hc-toggle open';
    } else {
      sub.style.display = 'none';
      tog.className = 'hc-toggle';
    }
  }
}

function buildComponentReuse() {
  var data = DATA.componentReuse;
  if (!data || !data.length) return '';
  var maxC = 1;
  for (var i = 0; i < data.length; i++) {
    if (data[i].consumers > maxC) maxC = data[i].consumers;
  }
  var rows = '';
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    var pct = (item.consumers / maxC * 100).toFixed(1);
    var col = item.consumers >= 2
      ? 'var(--success)'
      : (item.consumers === 1 ? 'var(--warning)' : 'var(--error)');
    var badge = item.consumers === 0
      ? '<span class="cr-badge cr-unused">unused</span>'
      : (item.consumers === 1 ? '<span class="cr-badge cr-single">1\xd7</span>' : '');
    rows += '<div class="bar-row">' +
      '<div class="cr-path" title="' + esc(item.relativePath) + '">' + esc(item.relativePath) + '</div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + col + ';opacity:.8"></div></div>' +
      '<div class="bar-count" style="color:' + col + '">' + item.consumers + '</div>' +
      badge +
      '</div>';
  }
  var unused = 0;
  for (var j = 0; j < data.length; j++) { if (data[j].consumers === 0) unused++; }
  var subtitle = data.length + ' component' + (data.length !== 1 ? 's' : '') +
    (unused > 0 ? ' \xb7 ' + unused + ' unused' : '');
  return '<div class="section-card">' +
    '<div class="section-header">Component Reuse &nbsp;<span style="font-weight:400;text-transform:none;letter-spacing:0;opacity:.7">' + esc(subtitle) + '</span></div>' +
    '<div class="chart-body">' + rows + '</div>' +
    '</div>';
}

function refreshViolations() {
  var filtered = getFiltered();
  var btns = document.querySelectorAll('.filter-btn');
  for (var i = 0; i < btns.length; i++) {
    var sv = btns[i].getAttribute('data-severity');
    btns[i].className = 'filter-btn' + (sv === state.severity ? ' active btn-' + sv : '');
  }
  var countEl = document.querySelector('.result-count');
  if (countEl) { var c = filtered.length; countEl.textContent = c + ' violation' + (c !== 1 ? 's' : ''); }
  var list = document.getElementById('violations-list');
  if (list) list.innerHTML = buildViolationsList(filtered);
}

function attachListeners() {
  var toolbar = document.getElementById('toolbar');
  if (toolbar) {
    toolbar.addEventListener('click', function(e) {
      var el = e.target || e.srcElement;
      while (el && el !== toolbar) {
        if (el.className && el.className.indexOf('filter-btn') !== -1) {
          state.severity = el.getAttribute('data-severity');
          refreshViolations();
          return;
        }
        el = el.parentNode;
      }
    });
  }
  var catSel = document.getElementById('cat-select');
  if (catSel) {
    catSel.addEventListener('change', function(e) {
      state.category = (e.target || e.srcElement).value;
      refreshViolations();
    });
  }
  var list = document.getElementById('violations-list');
  if (list) {
    list.addEventListener('click', function(e) {
      var el = e.target || e.srcElement;
      while (el && el !== list) {
        if (el.className && el.className.indexOf('file-header') !== -1) {
          var fp = el.getAttribute('data-file');
          var id = el.getAttribute('data-id');
          var body = document.getElementById(id + '-body');
          var icon = document.getElementById(id + '-icon');
          if (body && icon) {
            if (collapsedFiles[fp]) {
              delete collapsedFiles[fp];
              body.style.display = '';
              icon.className = 'toggle-icon open';
            } else {
              collapsedFiles[fp] = true;
              body.style.display = 'none';
              icon.className = 'toggle-icon';
            }
          }
          return;
        }
        el = el.parentNode;
      }
    });
  }
}

function render() {
  var filtered = getFiltered();
  var html = buildHeader() +
    buildSummary() +
    buildHealthScore() +
    '<main class="main">' +
      buildComponentReuse() +
      buildCategoryChart() +
      buildDepGraph() +
      '<div class="section-card">' +
        '<div class="section-header">Violations</div>' +
        buildToolbar(filtered) +
        '<div id="violations-list">' + buildViolationsList(filtered) + '</div>' +
      '</div>' +
    '</main>';
  document.getElementById('app').innerHTML = html;
  attachListeners();
  initDepGraph();
}

// ── Dependency Graph ──────────────────────────────────────────────────────────

function buildDepGraph() {
  if (!DATA.depGraph || !DATA.depGraph.nodes.length) return '';
  var nc = DATA.depGraph.nodes.length, ec = DATA.depGraph.edges.length;
  return '<div class="section-card">' +
    '<div class="section-header">Dependency Graph' +
      '&nbsp;<span style="font-weight:400;text-transform:none;letter-spacing:0;opacity:.7">' +
      nc + ' nodes \xb7 ' + ec + ' edges</span>' +
    '</div>' +
    '<div class="dep-graph-wrap" id="dep-graph-wrap">' +
      '<div class="dep-controls">' +
        '<button class="dep-btn" onclick="depResetView()">Reset view</button>' +
        '<span id="dep-zoom-lbl" class="dep-zoom-lbl">100%</span>' +
        '<span class="dep-hint">Scroll to zoom \xb7 drag canvas to pan \xb7 drag nodes</span>' +
      '</div>' +
      '<canvas id="dep-canvas" class="dep-canvas"></canvas>' +
      '<div id="dep-tooltip" class="dep-tooltip"></div>' +
      '<div id="dep-legend" class="dep-legend"></div>' +
    '</div>' +
    '</div>';
}

function initDepGraph() {
  var wrap = document.getElementById('dep-graph-wrap');
  var canvas = document.getElementById('dep-canvas');
  if (!wrap || !canvas || !DATA.depGraph || !DATA.depGraph.nodes.length) return;

  var W = wrap.clientWidth || 900;
  var H = 520;
  var dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var gnodes = DATA.depGraph.nodes.map(function(n, i) {
    var angle = (i / DATA.depGraph.nodes.length) * 2 * Math.PI;
    var r0 = Math.min(W, H) * 0.34;
    return {
      id: n.id, label: n.label, rel: n.rel,
      layer: n.layer || '', domain: n.domain || '',
      violations: n.violations || 0, degree: n.degree || 0,
      x: W / 2 + r0 * Math.cos(angle),
      y: H / 2 + r0 * Math.sin(angle),
      vx: 0, vy: 0, fx: 0, fy: 0, pinned: false
    };
  });

  var gedges = DATA.depGraph.edges;
  var gidx = {};
  for (var ii = 0; ii < gnodes.length; ii++) gidx[gnodes[ii].id] = ii;

  var LCOLS = {
    presentation: '#818cf8', application: '#60a5fa',
    domain: '#4ade80', infrastructure: '#fbbf24', shared: '#f472b6'
  };
  function ncolor(n) { return LCOLS[n.layer] || '#94a3b8'; }
  function nradius(n) { return Math.max(5, Math.min(14, 5 + n.degree * 0.6)); }

  var zoom = 1, panX = 0, panY = 0;
  var hov = -1, simFrame = 0;
  var isDrag = false, dragNode = -1, dragSX = 0, dragSY = 0;
  var tooltip = document.getElementById('dep-tooltip');

  var REP = 900, SPK = 0.04, SPL = 90, DAMP = 0.82, GRAV = 0.03;

  function simStep() {
    var n = gnodes.length, i, j, k, dx, dy, d, f, si, ti;
    for (i = 0; i < n; i++) { gnodes[i].fx = 0; gnodes[i].fy = 0; }
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        dx = gnodes[j].x - gnodes[i].x || 0.01;
        dy = gnodes[j].y - gnodes[i].y || 0.01;
        d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        f = REP / (d * d + 1);
        gnodes[i].fx -= f * dx / d; gnodes[i].fy -= f * dy / d;
        gnodes[j].fx += f * dx / d; gnodes[j].fy += f * dy / d;
      }
    }
    for (k = 0; k < gedges.length; k++) {
      si = gidx[gedges[k].source]; ti = gidx[gedges[k].target];
      if (si === undefined || ti === undefined) continue;
      dx = gnodes[ti].x - gnodes[si].x;
      dy = gnodes[ti].y - gnodes[si].y;
      d = Math.sqrt(dx * dx + dy * dy) || 1;
      f = SPK * (d - SPL);
      gnodes[si].fx += f * dx / d; gnodes[si].fy += f * dy / d;
      gnodes[ti].fx -= f * dx / d; gnodes[ti].fy -= f * dy / d;
    }
    for (i = 0; i < n; i++) {
      gnodes[i].fx += GRAV * (W / 2 - gnodes[i].x);
      gnodes[i].fy += GRAV * (H / 2 - gnodes[i].y);
    }
    for (i = 0; i < n; i++) {
      if (gnodes[i].pinned) continue;
      gnodes[i].vx = (gnodes[i].vx + gnodes[i].fx) * DAMP;
      gnodes[i].vy = (gnodes[i].vy + gnodes[i].fy) * DAMP;
      gnodes[i].x += gnodes[i].vx;
      gnodes[i].y += gnodes[i].vy;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    var k, si, ti, alpha, i, gn, r, col, isHov;
    for (k = 0; k < gedges.length; k++) {
      si = gidx[gedges[k].source]; ti = gidx[gedges[k].target];
      if (si === undefined || ti === undefined) continue;
      alpha = (si === hov || ti === hov) ? 0.75 : 0.18;
      ctx.strokeStyle = 'rgba(148,163,184,' + alpha + ')';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(gnodes[si].x, gnodes[si].y);
      ctx.lineTo(gnodes[ti].x, gnodes[ti].y);
      ctx.stroke();
    }

    for (i = 0; i < gnodes.length; i++) {
      gn = gnodes[i]; r = nradius(gn); col = ncolor(gn); isHov = i === hov;
      if (gn.violations > 0) {
        ctx.beginPath();
        ctx.arc(gn.x, gn.y, r + 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(248,113,113,0.22)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(gn.x, gn.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = isHov ? col : col + 'bb';
      ctx.fill();
      if (isHov) {
        ctx.beginPath();
        ctx.arc(gn.x, gn.y, r + 0.5, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (isHov || gn.degree > 5) {
        ctx.font = '10px "SFMono-Regular",Consolas,monospace';
        ctx.fillStyle = isHov ? '#e2e8f0' : 'rgba(226,232,240,0.5)';
        ctx.fillText(gn.label, gn.x + r + 5, gn.y + 4);
      }
    }
    ctx.restore();
  }

  window.depResetView = function() {
    zoom = 1; panX = 0; panY = 0;
    var zl = document.getElementById('dep-zoom-lbl');
    if (zl) zl.textContent = '100%';
  };

  function updateZoomLbl() {
    var zl = document.getElementById('dep-zoom-lbl');
    if (zl) zl.textContent = Math.round(zoom * 100) + '%';
  }

  function animate() {
    if (simFrame < 280) simStep();
    simFrame++;
    draw();
    requestAnimationFrame(animate);
  }
  animate();

  function canvasXY(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function toGraph(sx, sy) { return { x: (sx - panX) / zoom, y: (sy - panY) / zoom }; }
  function hitTest(gx, gy) {
    for (var i = 0; i < gnodes.length; i++) {
      var r = nradius(gnodes[i]) + 3;
      var dx = gx - gnodes[i].x, dy = gy - gnodes[i].y;
      if (dx * dx + dy * dy < r * r) return i;
    }
    return -1;
  }

  function showTip(e, ni) {
    if (!tooltip) return;
    if (ni < 0) { tooltip.style.display = 'none'; return; }
    var n = gnodes[ni];
    tooltip.innerHTML =
      '<strong>' + esc(n.label) + '</strong>' +
      '<span class="dep-tt-path">' + esc(n.rel) + '</span>' +
      (n.layer ? 'Layer: <em>' + esc(n.layer) + '</em>' : '') +
      (n.domain ? ' &middot; Domain: <em>' + esc(n.domain) + '</em>' : '') +
      (n.violations ? '<br><span style="color:var(--error)">' + n.violations + ' violation' + (n.violations !== 1 ? 's' : '') + '</span>' : '') +
      '<br><span class="dep-tt-deg">degree: ' + n.degree + '</span>';
    var rect = canvas.getBoundingClientRect();
    var tx = e.clientX - rect.left + 16, ty = e.clientY - rect.top - 10;
    if (tx + 240 > rect.width) tx -= 256;
    tooltip.style.left = tx + 'px';
    tooltip.style.top = ty + 'px';
    tooltip.style.display = 'block';
  }

  canvas.addEventListener('mousemove', function(e) {
    var cp = canvasXY(e);
    if (isDrag) {
      if (dragNode >= 0) {
        var g = toGraph(cp.x, cp.y);
        gnodes[dragNode].x = g.x; gnodes[dragNode].y = g.y;
        gnodes[dragNode].vx = 0; gnodes[dragNode].vy = 0;
      } else {
        panX += cp.x - dragSX; panY += cp.y - dragSY;
        dragSX = cp.x; dragSY = cp.y;
        updateZoomLbl();
      }
      return;
    }
    var g2 = toGraph(cp.x, cp.y);
    hov = hitTest(g2.x, g2.y);
    canvas.style.cursor = hov >= 0 ? 'pointer' : 'grab';
    showTip(e, hov);
  });

  canvas.addEventListener('mousedown', function(e) {
    var cp = canvasXY(e);
    var g = toGraph(cp.x, cp.y);
    var hi = hitTest(g.x, g.y);
    isDrag = true;
    if (hi >= 0) { dragNode = hi; gnodes[hi].pinned = true; }
    else { dragNode = -1; dragSX = cp.x; dragSY = cp.y; }
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  });

  canvas.addEventListener('mouseup', function() {
    if (dragNode >= 0) gnodes[dragNode].pinned = false;
    isDrag = false; dragNode = -1;
    canvas.style.cursor = hov >= 0 ? 'pointer' : 'grab';
  });

  canvas.addEventListener('mouseleave', function() {
    hov = -1; isDrag = false; dragNode = -1;
    if (tooltip) tooltip.style.display = 'none';
  });

  canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    var cp = canvasXY(e);
    var factor = e.deltaY > 0 ? 0.88 : 1.12;
    var newZ = Math.max(0.15, Math.min(6, zoom * factor));
    panX = cp.x - (cp.x - panX) * (newZ / zoom);
    panY = cp.y - (cp.y - panY) * (newZ / zoom);
    zoom = newZ;
    updateZoomLbl();
  }, { passive: false });

  var legend = document.getElementById('dep-legend');
  if (legend) {
    var layers = ['presentation', 'application', 'domain', 'infrastructure', 'shared'];
    var lh = '';
    for (var li = 0; li < layers.length; li++) {
      lh += '<span class="dep-leg-item"><span class="dep-leg-dot" style="background:' + LCOLS[layers[li]] + '"></span>' + layers[li] + '</span>';
    }
    lh += '<span class="dep-leg-item"><span class="dep-leg-dot" style="background:#94a3b8"></span>other</span>';
    lh += '<span class="dep-leg-item"><span class="dep-leg-ring"></span>has violations</span>';
    legend.innerHTML = lh;
  }
}

document.addEventListener('DOMContentLoaded', render);
`;
// ── HTML assembly ─────────────────────────────────────────────────────────────
function buildHtml(projectName, safeJson) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ArchGuard — ${projectName}</title>
  <style>${CSS}</style>
</head>
<body>
  <div id="app"></div>
  <script>
var DATA = ${safeJson};
${JS}  </script>
</body>
</html>`;
}
//# sourceMappingURL=html.js.map