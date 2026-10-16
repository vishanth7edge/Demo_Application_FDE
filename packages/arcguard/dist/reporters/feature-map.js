"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMapData = buildMapData;
exports.generateFeatureMap = generateFeatureMap;
// ─── Classification helpers ───────────────────────────────────────────────────
const LAYER_PATTERNS = [
    [/[/\\](pages|views|screens|presentation)[/\\]/i, 'presentation'],
    [/[/\\](components|ui)[/\\]/i, 'presentation'],
    [/[/\\](application|use-cases|usecases)[/\\]/i, 'application'],
    [/[/\\]hooks[/\\]/i, 'application'],
    [/[/\\](domain|entities|models|repositories)[/\\]/i, 'domain'],
    [/[/\\](infrastructure|infra|adapters)[/\\]/i, 'infrastructure'],
    [/[/\\](api|services)[/\\]/i, 'infrastructure'],
];
const SKIP_SECTION_FOLDERS = new Set([
    'shared', 'common', 'utils', 'util', 'types', 'type', 'constants',
    'assets', 'styles', 'style', 'config', 'lib', 'store', 'stores',
    'test', 'tests', '__tests__', 'mocks', 'mock', 'helpers', 'helper',
    'public', 'dist', 'build', 'node_modules', 'components', 'src', 'app',
]);
const SKIP_DOMAIN_FOLDERS = new Set([
    ...Array.from(SKIP_SECTION_FOLDERS),
]);
function detectLayer(rel) {
    for (const [re, layer] of LAYER_PATTERNS) {
        if (re.test(rel))
            return layer;
    }
    return 'unknown';
}
function detectDomain(rel) {
    const m1 = /(?:^|[/\\])(?:domains?|features?)[/\\]([^/\\]+)/i.exec(rel);
    if (m1)
        return m1[1];
    const m2 = /^src[/\\]([^/\\]+)[/\\]/i.exec(rel);
    if (m2 && !SKIP_DOMAIN_FOLDERS.has(m2[1].toLowerCase()))
        return m2[1];
    const m3 = /^app[/\\]([^/\\]+)[/\\]/i.exec(rel);
    if (m3 && !SKIP_DOMAIN_FOLDERS.has(m3[1].toLowerCase()))
        return m3[1];
    const m4 = /^src[/\\](?:pages|views|screens)[/\\]([^/\\]+)[/\\]/i.exec(rel);
    if (m4 && !SKIP_DOMAIN_FOLDERS.has(m4[1].toLowerCase()))
        return m4[1];
    return null;
}
/** Extract sub-flow section: the folder segment immediately after the domain segment. */
function detectSection(rel, domain) {
    const norm = rel.replace(/\\/g, '/');
    const parts = norm.split('/');
    if (domain) {
        for (let i = 0; i < parts.length - 1; i++) {
            if (parts[i].toLowerCase() === domain.toLowerCase()) {
                // Next segment exists and is not the file itself
                if (i + 2 < parts.length) {
                    const seg = parts[i + 1];
                    if (!SKIP_SECTION_FOLDERS.has(seg.toLowerCase()))
                        return seg;
                }
                break;
            }
        }
    }
    // Fall back: parent folder name (skip trivial ones)
    if (parts.length >= 2) {
        const parent = parts[parts.length - 2];
        if (!SKIP_SECTION_FOLDERS.has(parent.toLowerCase()))
            return parent;
    }
    return '__root__';
}
function detectType(file) {
    const name = file.name.toLowerCase();
    const ext = file.extension;
    if (/\.(test|spec)$/.test(name) || /[/\\](__tests__|tests?)[/\\]/.test(file.relativePath))
        return 'test';
    if (name === 'index')
        return 'barrel';
    if (name.startsWith('use') && ['.ts', '.tsx'].includes(ext))
        return 'hook';
    if (name.endsWith('context') && ['.ts', '.tsx'].includes(ext))
        return 'context';
    if (/\.(service|repository|repo)$/.test(name))
        return 'service';
    if (/\.(enum|enums)$/.test(name))
        return 'enum';
    if (['.tsx', '.jsx'].includes(ext))
        return 'component';
    return 'util';
}
// ─── Build map data ────────────────────────────────────────────────────────────
function buildMapData(scanResult, violations) {
    var _a;
    const violationsByFile = {};
    for (const v of violations) {
        (violationsByFile[_a = v.relativePath] ?? (violationsByFile[_a] = [])).push({
            ruleId: v.ruleId, severity: v.severity,
            message: v.message, suggestion: v.suggestion,
        });
    }
    const relByAbs = {};
    for (const f of scanResult.files)
        relByAbs[f.path] = f.relativePath;
    const nodes = [];
    for (const file of scanResult.files) {
        if (file.isDirectory)
            continue;
        if (!/\.(ts|tsx|js|jsx)$/.test(file.extension))
            continue;
        if (/node_modules/.test(file.relativePath))
            continue;
        const imports = [];
        for (const imp of file.imports) {
            const rel = relByAbs[imp];
            if (rel && rel !== file.relativePath)
                imports.push(rel);
        }
        const domain = detectDomain(file.relativePath);
        const section = detectSection(file.relativePath, domain);
        nodes.push({
            id: file.relativePath,
            label: file.name + file.extension,
            type: detectType(file),
            layer: detectLayer(file.relativePath),
            domain,
            section,
            imports,
            importedBy: [],
            violations: violationsByFile[file.relativePath] ?? [],
            lineCount: file.lineCount,
        });
    }
    const nodeById = {};
    for (const n of nodes)
        nodeById[n.id] = n;
    for (const n of nodes) {
        for (const imp of n.imports) {
            if (nodeById[imp])
                nodeById[imp].importedBy.push(n.id);
        }
    }
    const domains = Array.from(new Set(nodes.map(n => n.domain).filter(Boolean))).sort();
    return { nodes, domains };
}
// ─── HTML generator ────────────────────────────────────────────────────────────
function generateFeatureMap(scanResult, violations, projectRoot) {
    const { nodes, domains } = buildMapData(scanResult, violations);
    const dataJson = JSON.stringify({ nodes, domains, projectRoot });
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ArcGuard Feature Map</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0d1117;--surface:#161b22;--surface2:#1c2128;--border:#30363d;--border2:#21262d;
  --text:#e6edf3;--muted:#8b949e;
  --teal:#0BADBC;--blue:#58a6ff;--purple:#a371f7;--orange:#f0883e;--green:#3fb950;
  --red:#f85149;--amber:#d29922;--gray:#6e7681;
  --label-w:130px;--node-w:188px;--node-h:70px;--gap-x:40px;--gap-y:12px;--lpad:14px;
  --panel-w:360px;
}
body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;font-size:13px;overflow:hidden;height:100vh;display:flex;flex-direction:column}
/* ── header ── */
#hdr{padding:12px 20px 0;flex-shrink:0;background:var(--bg)}
#hdr h1{font-size:17px;font-weight:600;letter-spacing:-.01em}
#hdr p{color:var(--muted);font-size:11px;margin-top:2px;margin-bottom:10px}
/* ── epic tabs ── */
#tabs{display:flex;gap:0;border-bottom:1px solid var(--border);overflow-x:auto}
.tab{padding:8px 18px;cursor:pointer;color:var(--muted);border-bottom:2px solid transparent;white-space:nowrap;font-size:12px;transition:color .15s;flex-shrink:0}
.tab:hover{color:var(--text)}
.tab.active{color:var(--teal);border-bottom-color:var(--teal);font-weight:600}
/* ── sub-category bar ── */
#subcats{display:none;align-items:center;gap:6px;padding:7px 16px;border-bottom:1px solid var(--border2);background:var(--surface2);overflow-x:auto;flex-shrink:0}
#subcats.show{display:flex}
#subcats-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--gray);flex-shrink:0;margin-right:4px}
.scat{display:flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;border:1px solid var(--border);background:transparent;cursor:pointer;color:var(--muted);font-size:11px;white-space:nowrap;transition:all .15s;flex-shrink:0}
.scat:hover{color:var(--text);border-color:var(--muted)}
.scat.active{color:var(--teal);border-color:var(--teal);background:rgba(11,173,188,.08);font-weight:600}
.scat-count{font-size:9px;background:rgba(139,148,158,.12);color:var(--gray);padding:0 5px;border-radius:8px;line-height:16px}
.scat.active .scat-count{background:rgba(11,173,188,.15);color:var(--teal)}
.scat-label{flex-shrink:0}
.scat-err{font-size:9px;background:rgba(248,81,73,.1);color:var(--red);padding:0 5px;border-radius:8px;line-height:16px}
/* ── toolbar ── */
#toolbar{display:flex;align-items:center;gap:8px;padding:5px 16px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--bg)}
.tbtn{background:rgba(139,148,158,.08);border:1px solid var(--border);color:var(--muted);padding:3px 10px;border-radius:4px;cursor:pointer;font-size:11px;transition:all .15s}
.tbtn:hover{color:var(--text);border-color:var(--muted)}
.tbtn.on{color:var(--teal);border-color:rgba(11,173,188,.5);background:rgba(11,173,188,.07)}
#sbar{font-size:11px;color:var(--muted);margin-left:auto}
/* search */
#srchwrap{display:flex;align-items:center;gap:0;border:1px solid var(--border);border-radius:6px;background:var(--surface2);padding:0 6px;transition:border-color .15s;margin-left:auto}
#srchwrap:focus-within{border-color:var(--teal)}
#srch-icon{font-size:14px;color:var(--muted);flex-shrink:0;line-height:1}
#srch{background:none;border:none;outline:none;color:var(--text);font-size:12px;width:200px;padding:4px 4px;font-family:inherit}
#srch::placeholder{color:var(--muted)}
#srch-clr{background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:0 2px;line-height:1;display:none}
#srch-clr.vis{display:block}
#srch-clr:hover{color:var(--text)}
#sbar{font-size:11px;color:var(--muted);flex-shrink:0}
/* match highlight */
.node.search-match{outline:2px solid var(--teal);outline-offset:2px;box-shadow:0 0 8px rgba(11,173,188,.35)}
.node.search-hide{opacity:.08;pointer-events:none}
/* ── canvas ── */
#cv{flex:1;overflow:auto;position:relative;background:
  linear-gradient(rgba(48,54,61,.4) 1px,transparent 1px),
  linear-gradient(90deg,rgba(48,54,61,.4) 1px,transparent 1px);
  background-size:28px 28px;background-color:var(--bg)}
#mr{position:relative;padding:20px 28px 60px;display:inline-block;min-width:100%}
#asvg{position:absolute;top:0;left:0;pointer-events:none;overflow:visible;z-index:1}
/* ── flow section ── */
.flow-section{margin-bottom:28px;border:1px solid var(--border2);border-radius:8px;overflow:hidden;background:rgba(22,27,34,.5)}
.sec-hdr{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--surface2);border-bottom:1px solid var(--border2);cursor:pointer;user-select:none}
.sec-title{font-size:12px;font-weight:700;color:var(--text);letter-spacing:.02em}
.sec-count{font-size:10px;color:var(--muted);background:rgba(139,148,158,.1);padding:1px 7px;border-radius:10px}
.sec-errs{font-size:10px;color:var(--red);background:rgba(248,81,73,.1);padding:1px 7px;border-radius:10px}
.sec-warns{font-size:10px;color:var(--amber);background:rgba(210,153,34,.1);padding:1px 7px;border-radius:10px}
.sec-toggle{margin-left:auto;font-size:14px;color:var(--muted);transition:transform .2s}
.sec-toggle.collapsed{transform:rotate(-90deg)}
.sec-body{overflow:hidden;transition:max-height .25s ease}
.sec-body.collapsed{max-height:0!important}
/* ── lane ── */
.lane{display:flex;align-items:stretch;margin-bottom:4px;position:relative}
.lane:last-child{margin-bottom:0}
.lane-lbl{width:var(--label-w);flex-shrink:0;font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding-right:10px;padding-top:10px;text-align:right;border-right:2px solid var(--border2)}
.lane[data-layer=presentation] .lane-lbl{color:var(--teal)}
.lane[data-layer=application]  .lane-lbl{color:var(--blue)}
.lane[data-layer=domain]       .lane-lbl{color:var(--purple)}
.lane[data-layer=infrastructure].lane-lbl{color:var(--orange)}
.lane[data-layer=test]         .lane-lbl{color:var(--amber)}
.lane[data-layer=unknown]      .lane-lbl{color:var(--gray)}
.lane-cv{position:relative;flex:1;margin-left:16px}
/* ── node ── */
.node{
  position:absolute;width:var(--node-w);height:var(--node-h);
  border-radius:6px;background:var(--surface);border:1.5px solid var(--border);
  cursor:pointer;padding:9px 11px 8px;
  transition:border-color .15s,box-shadow .15s,opacity .15s;
  display:flex;flex-direction:column;justify-content:space-between;z-index:2;
}
.node:hover{border-color:var(--teal);box-shadow:0 0 0 2px rgba(11,173,188,.15)}
.node.selected{border-color:var(--orange)!important;box-shadow:0 0 0 3px rgba(240,136,62,.2)!important}
.node.dimmed{opacity:.15;pointer-events:none}
.ntype{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:2px}
.nlbl{font-size:11.5px;font-weight:500;color:var(--text);line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nmeta{display:flex;align-items:center;gap:4px;margin-top:4px}
.bg{font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;flex-shrink:0}
.be{background:rgba(248,81,73,.14);color:var(--red)}
.bw{background:rgba(210,153,34,.13);color:var(--amber)}
.bo{background:rgba(63,185,80,.09);color:var(--green)}
.bl{background:rgba(139,148,158,.08);color:var(--gray);font-size:9px;padding:1px 5px;border-radius:3px}
.node::before{content:'';position:absolute;left:0;top:5px;bottom:5px;width:3px;border-radius:2px}
.node[data-type=component]::before{background:var(--teal)}
.node[data-type=hook]::before{background:var(--blue)}
.node[data-type=service]::before{background:var(--purple)}
.node[data-type=context]::before{background:var(--orange)}
.node[data-type=enum]::before,.node[data-type=util]::before{background:var(--green)}
.node[data-type=barrel]::before{background:var(--gray)}
.node[data-type=test]::before{background:var(--amber)}
.node[data-type=component] .ntype{color:var(--teal)}
.node[data-type=hook]      .ntype{color:var(--blue)}
.node[data-type=service]   .ntype{color:var(--purple)}
.node[data-type=context]   .ntype{color:var(--orange)}
.node[data-type=enum]      .ntype,.node[data-type=util] .ntype{color:var(--green)}
.node[data-type=barrel]    .ntype{color:var(--gray)}
.node[data-type=test]      .ntype{color:var(--amber)}
/* ── legend ── */
#leg{position:fixed;bottom:16px;left:16px;background:rgba(13,17,23,.92);border:1px solid var(--border);border-radius:8px;padding:10px 14px;z-index:20;backdrop-filter:blur(8px)}
#leg h4{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:7px}
.lr{display:flex;align-items:center;gap:7px;font-size:10px;color:var(--muted);margin-bottom:3px}
.ld{width:10px;height:10px;border-radius:2px;flex-shrink:0}
.lhint{font-size:9px;color:var(--gray);margin-top:6px}
/* ── panel ── */
#pnl{position:fixed;top:0;right:0;width:var(--panel-w);height:100vh;background:var(--surface);border-left:1px solid var(--border);transform:translateX(100%);transition:transform .22s ease;z-index:50;display:flex;flex-direction:column}
#pnl.open{transform:translateX(0)}
#ph{padding:15px 16px 10px;border-bottom:1px solid var(--border);flex-shrink:0;position:relative}
#pt{font-size:14px;font-weight:600;word-break:break-all;padding-right:26px}
#ptg{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
.ptag{font-size:9px;font-weight:700;padding:2px 7px;border-radius:4px;background:rgba(139,148,158,.1);color:var(--muted);text-transform:uppercase;letter-spacing:.07em}
#pcl{position:absolute;top:13px;right:14px;background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;line-height:1}
#pb{overflow-y:auto;flex:1;padding:13px 16px}
.ps{margin-bottom:14px}
.ps h3{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid var(--border)}
.sr{display:flex;justify-content:space-between;align-items:flex-start;font-size:12px;color:var(--muted);padding:3px 0}
.sv{color:var(--text);font-weight:500;text-align:right;word-break:break-all;max-width:200px}
.vi{background:rgba(139,148,158,.05);border:1px solid var(--border);border-radius:5px;padding:7px 9px;margin-bottom:5px}
.vi.er{border-left:3px solid var(--red)}
.vi.wa{border-left:3px solid var(--amber)}
.vr{font-size:10px;font-weight:700;color:var(--muted);margin-bottom:2px}
.vm{font-size:11px;color:var(--text);line-height:1.4}
.vs{font-size:10px;color:var(--teal);margin-top:3px}
ul.il{list-style:none}
ul.il li{font-size:11px;color:var(--muted);padding:2px 0;border-bottom:1px solid rgba(48,54,61,.4);word-break:break-all}
ul.il li:last-child{border:none}
#empty{display:none;align-items:center;justify-content:center;height:50vh;color:var(--muted);font-size:13px}
#empty.show{display:flex}
</style>
</head>
<body>
<div id="hdr">
  <h1>ArcGuard Feature Map</h1>
  <p id="proj"></p>
  <div id="tabs"></div>
</div>
<div id="subcats">
  <span id="subcats-label">Sub-category</span>
</div>
<div id="toolbar">
  <button class="tbtn on" id="bt-tests">Tests</button>
  <button class="tbtn on" id="bt-barrels">Barrels</button>
  <button class="tbtn on" id="bt-arrows">Arrows</button>
  <div id="srchwrap"><span id="srch-icon">⌕</span><input id="srch" type="text" placeholder="Search files… (⌘K)" autocomplete="off" spellcheck="false"/><button id="srch-clr" title="Clear">×</button></div>
  <span id="sbar"></span>
</div>
<div id="cv">
  <div id="mr">
    <svg id="asvg"></svg>
    <div id="lc"></div>
  </div>
  <div id="empty">No files detected for this tab.</div>
</div>
<div id="leg">
  <h4>Reading the map</h4>
  <div class="lr"><span class="ld" style="background:var(--teal)"></span>Component</div>
  <div class="lr"><span class="ld" style="background:var(--blue)"></span>Hook</div>
  <div class="lr"><span class="ld" style="background:var(--purple)"></span>Service</div>
  <div class="lr"><span class="ld" style="background:var(--orange)"></span>Context</div>
  <div class="lr"><span class="ld" style="background:var(--green)"></span>Enum / Util</div>
  <div class="lr"><span class="ld" style="background:var(--amber)"></span>Test</div>
  <div class="lhint">← entry points &nbsp;&nbsp; dependencies →</div>
</div>
<div id="pnl">
  <div id="ph">
    <div id="pt"></div>
    <div id="ptg"></div>
    <button id="pcl">×</button>
  </div>
  <div id="pb"></div>
</div>
<script>
(function(){
const D = ${dataJson};
const NODES = D.nodes;
const DOMAINS = D.domains;
const nodeById = {};
NODES.forEach(n => nodeById[n.id]=n);

const NW=188,NH=70,GX=40,GY=12,LP=14;
const LAYERS = ['presentation','application','domain','infrastructure','unknown'];
const LLBL   = {presentation:'Presentation',application:'Application',domain:'Domain',infrastructure:'Infrastructure',unknown:'Other'};

// ── state ──
let tab='all', activeSec='all', selId=null, showTests=true, showBarrels=true, showArrows=true, searchQ='';

// ── utils ──
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function toTitle(s){
  if(s==='__root__') return 'Root Files';
  return s.replace(/([A-Z])/g,' $1').replace(/[-_.]/g,' ').replace(/\s+/g,' ').trim()
          .replace(/\b\w/g,c=>c.toUpperCase());
}

// ── tabs ──
document.getElementById('proj').textContent = D.projectRoot;

function makeTabs(){
  const all=['all',...DOMAINS];
  document.getElementById('tabs').innerHTML=all.map(d=>
    '<div class="tab'+(d===tab?' active':'')+'" data-tab="'+d+'">'+(d==='all'?'All Epics':toTitle(d))+'</div>'
  ).join('');
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
    tab=t.dataset.tab; activeSec='all'; selId=null; closePanel();
    makeTabs(); makeSubcats(); render();
  }));
}
makeTabs();

// ── sub-category pills ──
function makeSubcats(){
  const bar=document.getElementById('subcats');

  // collect sections available in current tab
  let base = tab==='all' ? NODES : NODES.filter(n=>n.domain===tab);
  if(!showTests)   base=base.filter(n=>n.type!=='test');
  if(!showBarrels) base=base.filter(n=>n.type!=='barrel');

  // for "all" tab, sub-cats = domains; for a domain tab, sub-cats = sections
  const keyFn = tab==='all' ? n=>n.domain||'__root__' : n=>n.section;
  const secMap={};
  base.forEach(n=>{
    const k=keyFn(n);
    if(!secMap[k]) secMap[k]={count:0,errs:0};
    secMap[k].count++;
    secMap[k].errs+=n.violations.filter(v=>v.severity==='error').length;
  });
  const keys=Object.keys(secMap).sort((a,b)=>secMap[b].errs-secMap[a].errs||a.localeCompare(b));

  // hide bar if only 1 or 0 sections
  if(keys.length<=1){bar.classList.remove('show');return;}
  bar.classList.add('show');

  const total=base.length;
  const allErrs=base.reduce((s,n)=>s+n.violations.filter(v=>v.severity==='error').length,0);

  let html='<div class="scat'+(activeSec==='all'?' active':'')+'" data-sec="all">'
    +'<span class="scat-label">All</span><span class="scat-count">'+total+'</span>'
    +(allErrs?'<span class="scat-err">'+allErrs+'</span>':'')
    +'</div>';

  keys.forEach(k=>{
    const {count,errs}=secMap[k];
    html+='<div class="scat'+(activeSec===k?' active':'')+'" data-sec="'+esc(k)+'">'
      +'<span class="scat-label">'+esc(toTitle(k))+'</span>'
      +'<span class="scat-count">'+count+'</span>'
      +(errs?'<span class="scat-err">'+errs+'</span>':'')
      +'</div>';
  });

  // Replace pills but keep label
  const label=document.getElementById('subcats-label');
  bar.innerHTML='';
  bar.appendChild(label);
  bar.insertAdjacentHTML('beforeend',html);

  bar.querySelectorAll('.scat').forEach(el=>el.addEventListener('click',()=>{
    activeSec=el.dataset.sec; selId=null; closePanel();
    makeSubcats(); render();
  }));

  // Scroll the active pill into view without hiding adjacent pills
  const active=bar.querySelector('.scat.active');
  if(active) active.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
}
makeSubcats();

// ── toolbar ──
document.getElementById('bt-tests').addEventListener('click',function(){
  showTests=!showTests;this.classList.toggle('on',showTests);makeSubcats();render();
});
document.getElementById('bt-barrels').addEventListener('click',function(){
  showBarrels=!showBarrels;this.classList.toggle('on',showBarrels);makeSubcats();render();
});
document.getElementById('bt-arrows').addEventListener('click',function(){
  showArrows=!showArrows;this.classList.toggle('on',showArrows);drawArrows();
});

// ── search ──
const srchEl=document.getElementById('srch');
const srchClr=document.getElementById('srch-clr');

function applySearch(){
  const q=searchQ.trim().toLowerCase();
  if(!q){
    document.querySelectorAll('.node').forEach(el=>{
      el.classList.remove('search-match','search-hide');
    });
    return;
  }
  let matchCount=0;
  document.querySelectorAll('.node').forEach(el=>{
    const id=el.dataset.id||'';
    const n=nodeById[id];
    const label=(n?n.label:id).toLowerCase();
    const path=id.toLowerCase();
    const type=(n?n.type:'').toLowerCase();
    const domain=(n?n.domain||'':'').toLowerCase();
    const hit=label.includes(q)||path.includes(q)||type.includes(q)||domain.includes(q);
    el.classList.toggle('search-match',hit);
    el.classList.toggle('search-hide',!hit);
    if(hit)matchCount++;
  });
  // auto-scroll to first match
  const first=document.querySelector('.node.search-match');
  if(first){
    const cv=document.getElementById('cv');
    const cvR=cv.getBoundingClientRect();
    const fR=first.getBoundingClientRect();
    const mr=document.getElementById('mr');
    const mrR=mr.getBoundingClientRect();
    const lx=fR.left-mrR.left+cv.scrollLeft;
    const ly=fR.top-mrR.top+cv.scrollTop;
    cv.scrollTo({left:Math.max(0,lx-cvR.width/2+fR.width/2),top:Math.max(0,ly-cvR.height/2+fR.height/2),behavior:'smooth'});
  }
  return matchCount;
}

srchEl.addEventListener('input',function(){
  searchQ=this.value;
  srchClr.classList.toggle('vis',!!searchQ);
  applySearch();
});
srchClr.addEventListener('click',function(){
  searchQ='';srchEl.value='';srchClr.classList.remove('vis');
  applySearch();srchEl.focus();
});
// Cmd/Ctrl+K to focus search
document.addEventListener('keydown',function(e){
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();srchEl.focus();srchEl.select();}
  if(e.key==='Escape'&&document.activeElement===srchEl){
    searchQ='';srchEl.value='';srchClr.classList.remove('vis');applySearch();srchEl.blur();
  }
});

// ── filter ──
function visNodes(){
  let vn = tab==='all' ? NODES : NODES.filter(n=>n.domain===tab);
  if(!showTests)   vn=vn.filter(n=>n.type!=='test');
  if(!showBarrels) vn=vn.filter(n=>n.type!=='barrel');
  // apply sub-category filter
  if(activeSec!=='all'){
    const keyFn = tab==='all' ? n=>(n.domain||'__root__') : n=>n.section;
    vn=vn.filter(n=>keyFn(n)===activeSec);
  }
  return vn;
}

// ── topological depth ──
function depths(vn){
  const ids=new Set(vn.map(n=>n.id));
  const hasImp=new Set();
  vn.forEach(n=>n.imports.forEach(i=>{if(ids.has(i))hasImp.add(i);}));
  const d={};
  const q=vn.filter(n=>!hasImp.has(n.id)).map(n=>{d[n.id]=0;return n.id;});
  let h=0;
  while(h<q.length){
    const id=q[h++]; const n=nodeById[id]; if(!n)continue;
    n.imports.forEach(imp=>{
      if(!ids.has(imp))return;
      const nd=(d[id]||0)+1;
      if(d[imp]===undefined||d[imp]<nd){d[imp]=nd;q.push(imp);}
    });
  }
  vn.forEach(n=>{if(d[n.id]===undefined)d[n.id]=0;});
  return d;
}

// ── layout ──
function layout(vn){
  const dp=depths(vn);
  const slots={}, pos={}, maxSlot={};
  [...vn].sort((a,b)=>dp[a.id]-dp[b.id]).forEach(n=>{
    const d=dp[n.id]; const key=n.layer+'_'+d;
    const sl=slots[key]||0; slots[key]=sl+1;
    pos[n.id]={x:d*(NW+GX),y:sl*(NH+GY)};
    maxSlot[n.layer]=Math.max(maxSlot[n.layer]||0,sl+1);
  });
  const maxD=Math.max(0,...vn.map(n=>dp[n.id]));
  return {pos,maxSlot,maxD};
}

// ── render sections ──
function render(){
  const vn=visNodes();
  const lc=document.getElementById('lc');
  const emp=document.getElementById('empty');
  document.getElementById('asvg').innerHTML='';
  if(!vn.length){emp.classList.add('show');lc.innerHTML='';stats(0,0);return;}
  emp.classList.remove('show');

  // Group by section (for "all" tab, section = domain)
  const secMap={};
  vn.forEach(n=>{
    const key = tab==='all' ? (n.domain||'__root__') : n.section;
    (secMap[key]||(secMap[key]=[])).push(n);
  });

  // Sort sections: by error count desc, then alphabetically
  const secKeys=Object.keys(secMap).sort((a,b)=>{
    const ae=secMap[a].reduce((s,n)=>s+n.violations.filter(v=>v.severity==='error').length,0);
    const be=secMap[b].reduce((s,n)=>s+n.violations.filter(v=>v.severity==='error').length,0);
    if(ae!==be) return be-ae;
    return a.localeCompare(b);
  });

  lc.innerHTML = secKeys.map(key=>renderSection(key, secMap[key])).join('');

  // Attach click events
  document.querySelectorAll('.node').forEach(el=>{
    el.addEventListener('click',e=>{
      e.stopPropagation();
      const id=el.dataset.id;
      if(selId===id){selId=null;closePanel();clearHL();}
      else{selId=id;openPanel(nodeById[id]);hl(id);}
    });
  });

  // Section collapse toggle
  document.querySelectorAll('.sec-hdr').forEach(hdr=>{
    hdr.addEventListener('click',e=>{
      if(e.target.closest('.node')) return;
      const body=hdr.nextElementSibling;
      const tog=hdr.querySelector('.sec-toggle');
      const collapsed=body.classList.toggle('collapsed');
      tog.classList.toggle('collapsed',collapsed);
      if(!collapsed) setTimeout(drawArrows,300);
    });
  });

  stats(vn.length, vn.filter(n=>n.violations.length).length);
  setTimeout(()=>{ drawArrows(); applySearch(); },0);
}

function renderSection(key, sn){
  const {pos,maxSlot,maxD}=layout(sn);
  const errs =sn.reduce((s,n)=>s+n.violations.filter(v=>v.severity==='error').length,0);
  const warns=sn.reduce((s,n)=>s+n.violations.filter(v=>v.severity==='warning').length,0);

  const title = tab==='all' ? toTitle(key) : toTitle(key);

  const badgesHtml =
    (errs  ? '<span class="sec-errs">'+errs+' error'+(errs>1?'s':'')+'</span>' : '')
   +(warns ? '<span class="sec-warns">'+warns+' warn'+(warns>1?'s':'')+'</span>' : '');

  // Group section nodes by layer
  const byLayer={};
  LAYERS.forEach(l=>byLayer[l]=[]);
  sn.forEach(n=>byLayer[n.layer].push(n));

  const canvasW=(maxD+1)*(NW+GX)+LP*2;

  const lanesHtml=LAYERS.filter(l=>byLayer[l].length).map(layer=>{
    const ln=byLayer[layer];
    const sl=maxSlot[layer]||1;
    const h=sl*(NH+GY)+LP*2;
    const nodesHtml=ln.map(n=>{
      const p=pos[n.id];
      const e=n.violations.filter(v=>v.severity==='error').length;
      const w=n.violations.filter(v=>v.severity==='warning').length;
      const badge=e?'<span class="bg be">'+e+' err</span>':w?'<span class="bg bw">'+w+' warn</span>':'<span class="bg bo">clean</span>';
      return '<div class="node'+(selId===n.id?' selected':'')+'" data-id="'+esc(n.id)+'" data-type="'+n.type+'" data-section="'+esc(key)+'"'
        +' style="left:'+(p.x+LP)+'px;top:'+(p.y+LP)+'px">'
        +'<div class="ntype">'+n.type+'</div>'
        +'<div class="nlbl" title="'+esc(n.id)+'">'+esc(n.label)+'</div>'
        +'<div class="nmeta">'+badge+'<span class="bl">'+n.lineCount+'L</span></div>'
        +'</div>';
    }).join('');
    return '<div class="lane" data-layer="'+layer+'">'
      +'<div class="lane-lbl">'+LLBL[layer]+'</div>'
      +'<div class="lane-cv" style="height:'+h+'px;width:'+canvasW+'px">'+nodesHtml+'</div>'
      +'</div>';
  }).join('');

  return '<div class="flow-section" data-section="'+esc(key)+'">'
    +'<div class="sec-hdr">'
    +'<span class="sec-title">'+esc(title)+'</span>'
    +'<span class="sec-count">'+sn.length+' file'+(sn.length!==1?'s':'')+'</span>'
    +badgesHtml
    +'<span class="sec-toggle">▾</span>'
    +'</div>'
    +'<div class="sec-body" style="max-height:2000px">'
    +'<div style="padding:10px 12px">'+lanesHtml+'</div>'
    +'</div>'
    +'</div>';
}

function stats(t,v){
  document.getElementById('sbar').textContent=t+' files · '+(t-v)+' clean · '+v+' with violations';
}

// ── node section lookup ──
function buildElsAndSections(){
  const els={}, sec={};
  document.querySelectorAll('.node').forEach(el=>{
    els[el.dataset.id]=el;
    sec[el.dataset.id]=el.dataset.section||'';
  });
  return {els,sec};
}

// ── arrows ──
function drawArrows(){
  const svg=document.getElementById('asvg');
  const mr=document.getElementById('mr');
  if(!showArrows){svg.innerHTML='';return;}

  const vn=visNodes();
  const {els,sec}=buildElsAndSections();
  const rr=mr.getBoundingClientRect();
  const paths=[];
  const seen=new Set();

  for(const n of vn){
    for(const imp of n.imports){
      const key=n.id+'->'+imp;
      if(seen.has(key)||!els[n.id]||!els[imp])continue;
      // Skip cross-section arrows — target is in a different flow block,
      // so there is no valid anchor point to draw to.
      if(sec[n.id]!==sec[imp])continue;
      seen.add(key);

      const sr=els[n.id].getBoundingClientRect();
      const tr=els[imp].getBoundingClientRect();
      const hi=selId&&(selId===n.id||selId===imp);
      const op=selId?(hi?.85:.04):.18;
      const col=hi?'var(--teal)':'var(--muted)';
      const sw=hi?2:1;

      // Positions relative to #mr (viewport-relative diffs cancel scroll)
      const sx=sr.left-rr.left, sy=sr.top-rr.top, sw2=sr.width, sh=sr.height;
      const tx=tr.left-rr.left, ty=tr.top-rr.top, tw=tr.width, th=tr.height;

      let d;
      if(sx+sw2 <= tx+10){
        // forward arrow: source LEFT of target → right-edge → left-edge horizontal bezier
        const x1=sx+sw2, y1=sy+sh/2;
        const x2=tx,     y2=ty+th/2;
        const dx=Math.max(40,(x2-x1)*0.5);
        d='M'+x1+','+y1+' C'+(x1+dx)+','+y1+' '+(x2-dx)+','+y2+' '+x2+','+y2;
      } else {
        // backward arrow: source RIGHT of target → route ABOVE both nodes to avoid overlap
        const x1=sx+sw2/2, y1=sy;             // top-center of source
        const x2=tx+tw/2,  y2=ty;             // top-center of target
        const loopY=Math.min(y1,y2)-50;       // arc above the higher node
        d='M'+x1+','+y1+' C'+x1+','+(loopY)+' '+x2+','+(loopY)+' '+x2+','+y2;
      }

      paths.push('<path d="'+d+'" stroke="'+col+'" stroke-width="'+sw+'"'
        +' fill="none" opacity="'+op+'" marker-end="url(#ar)"/>');
    }
  }

  svg.innerHTML='<defs>'
    +'<marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">'
    +'<path d="M0,0 L0,6 L6,3 z" fill="var(--muted)" opacity="0.55"/></marker>'
    +'</defs>'+paths.join('');
  svg.style.width=mr.scrollWidth+'px';
  svg.style.height=mr.scrollHeight+'px';
}

// ── highlight + auto-scroll ──
function hl(id){
  const n=nodeById[id];
  const {els}=buildElsAndSections();
  // Only include connections whose nodes are currently rendered in the DOM
  const c=new Set([id,...n.imports.filter(i=>els[i]),...n.importedBy.filter(i=>els[i])]);
  document.querySelectorAll('.node').forEach(el=>{
    el.classList.toggle('dimmed',!c.has(el.dataset.id));
    el.classList.toggle('selected',el.dataset.id===id);
  });
  setTimeout(()=>{ drawArrows(); scrollToFit([...c]); },0);
}

function scrollToFit(ids){
  const cv=document.getElementById('cv');
  const mr=document.getElementById('mr');
  const mrRect=mr.getBoundingClientRect();
  const cvRect=cv.getBoundingClientRect();
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  ids.forEach(id=>{
    const el=document.querySelector('.node[data-id="'+CSS.escape(id)+'"]');
    if(!el)return;
    const r=el.getBoundingClientRect();
    // convert to mr-local coordinates
    const lx=r.left-mrRect.left+cv.scrollLeft;
    const ly=r.top-mrRect.top+cv.scrollTop;
    minX=Math.min(minX,lx);   maxX=Math.max(maxX,lx+r.width);
    minY=Math.min(minY,ly);   maxY=Math.max(maxY,ly+r.height);
  });
  if(minX===Infinity)return;
  const PAD=80;
  const cx=(minX+maxX)/2, cy=(minY+maxY)/2;
  cv.scrollTo({
    left:Math.max(0,cx-cvRect.width/2+PAD),
    top: Math.max(0,cy-cvRect.height/2),
    behavior:'smooth',
  });
}

function clearHL(){
  document.querySelectorAll('.node').forEach(el=>el.classList.remove('dimmed','selected'));
  setTimeout(drawArrows,0);
}

// ── panel ──
document.getElementById('pcl').addEventListener('click',()=>{selId=null;closePanel();clearHL();});
document.getElementById('cv').addEventListener('click',e=>{
  if(!e.target.closest('.node')){selId=null;closePanel();clearHL();}
});

function openPanel(n){
  const e=n.violations.filter(v=>v.severity==='error').length;
  const w=n.violations.filter(v=>v.severity==='warning').length;
  document.getElementById('pt').textContent=n.label;
  document.getElementById('ptg').innerHTML=
    '<span class="ptag">'+n.layer+'</span>'
    +'<span class="ptag">'+n.type+'</span>'
    +(n.domain?'<span class="ptag">'+esc(n.domain)+'</span>':'')
    +(n.section&&n.section!=='__root__'?'<span class="ptag">'+esc(toTitle(n.section))+'</span>':'');

  let h='<div class="ps"><h3>File info</h3>'
    +'<div class="sr"><span>Path</span><span class="sv" style="font-size:10px">'+esc(n.id)+'</span></div>'
    +'<div class="sr"><span>Lines</span><span class="sv">'+n.lineCount+'</span></div>'
    +'<div class="sr"><span>Errors</span><span class="sv" style="color:var(--red)">'+e+'</span></div>'
    +'<div class="sr"><span>Warnings</span><span class="sv" style="color:var(--amber)">'+w+'</span></div>'
    +'<div class="sr"><span>Imports</span><span class="sv">'+n.imports.length+'</span></div>'
    +'<div class="sr"><span>Imported by</span><span class="sv">'+n.importedBy.length+'</span></div>'
    +'</div>';

  if(n.violations.length){
    h+='<div class="ps"><h3>Violations ('+n.violations.length+')</h3>';
    n.violations.forEach(v=>{
      h+='<div class="vi '+(v.severity==='error'?'er':'wa')+'">'
        +'<div class="vr">'+esc(v.ruleId)+'</div>'
        +'<div class="vm">'+esc(v.message)+'</div>'
        +(v.suggestion?'<div class="vs">→ '+esc(v.suggestion)+'</div>':'')+'</div>';
    });
    h+='</div>';
  }

  // Partition imports into same-section and cross-section
  const {sec}=buildElsAndSections();
  const mySec=sec[n.id]||'';
  const sameImp=n.imports.filter(i=>(sec[i]||'')===(mySec));
  const crossImp=n.imports.filter(i=>(sec[i]||'')!==(mySec));
  const sameImpBy=n.importedBy.filter(i=>(sec[i]||'')===(mySec));
  const crossImpBy=n.importedBy.filter(i=>(sec[i]||'')!==(mySec));

  if(sameImp.length){
    h+='<div class="ps"><h3>Imports ('+sameImp.length+')</h3><ul class="il">'
      +sameImp.slice(0,25).map(i=>'<li>'+esc(i)+'</li>').join('')
      +(sameImp.length>25?'<li style="color:var(--gray)">…and '+(sameImp.length-25)+' more</li>':'')
      +'</ul></div>';
  }
  if(sameImpBy.length){
    h+='<div class="ps"><h3>Imported by ('+sameImpBy.length+')</h3><ul class="il">'
      +sameImpBy.slice(0,25).map(i=>'<li>'+esc(i)+'</li>').join('')
      +(sameImpBy.length>25?'<li style="color:var(--gray)">…and '+(sameImpBy.length-25)+' more</li>':'')
      +'</ul></div>';
  }
  if(crossImp.length||crossImpBy.length){
    h+='<div class="ps" style="border-left:3px solid var(--amber);padding-left:10px"><h3>Cross-flow dependencies</h3>'
      +'<p style="font-size:11px;color:var(--gray);margin:0 0 8px">These connections span different flow sections and are not drawn as arrows.</p>';
    if(crossImp.length){
      h+='<div style="font-size:11px;font-weight:600;margin-bottom:4px">Imports from other flows ('+crossImp.length+')</div>'
        +'<ul class="il">'+crossImp.slice(0,20).map(i=>{
          const sn=nodeById[i];
          const label=sn?sn.label:i;
          const secName=sec[i]?toTitle(sec[i]):'unknown';
          return '<li><span style="color:var(--gray)">['+esc(secName)+']</span> '+esc(label)+'</li>';
        }).join('')
        +(crossImp.length>20?'<li style="color:var(--gray)">…and '+(crossImp.length-20)+' more</li>':'')
        +'</ul>';
    }
    if(crossImpBy.length){
      h+='<div style="font-size:11px;font-weight:600;margin-bottom:4px;margin-top:8px">Imported by other flows ('+crossImpBy.length+')</div>'
        +'<ul class="il">'+crossImpBy.slice(0,20).map(i=>{
          const sn=nodeById[i];
          const label=sn?sn.label:i;
          const secName=sec[i]?toTitle(sec[i]):'unknown';
          return '<li><span style="color:var(--gray)">['+esc(secName)+']</span> '+esc(label)+'</li>';
        }).join('')
        +(crossImpBy.length>20?'<li style="color:var(--gray)">…and '+(crossImpBy.length-20)+' more</li>':'')
        +'</ul>';
    }
    h+='</div>';
  }

  document.getElementById('pb').innerHTML=h;
  document.getElementById('pnl').classList.add('open');
}
function closePanel(){document.getElementById('pnl').classList.remove('open');}

// ── init ──
render();
document.getElementById('cv').addEventListener('scroll',drawArrows);
window.addEventListener('resize',drawArrows);
})();
</script>
</body>
</html>`;
}
//# sourceMappingURL=feature-map.js.map