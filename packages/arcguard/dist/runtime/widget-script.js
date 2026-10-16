"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWidgetScript = generateWidgetScript;
function generateWidgetScript({ serverPort, projectRoot = '' }) {
    return `/* ArchGuard Runtime Widget — injected by arcguard */
(function(){
'use strict';
if(window.__arcguard_loaded) return;
window.__arcguard_loaded = true;

const AG_BASE = 'http://127.0.0.1:${serverPort}/__arcguard';
const PROJECT = ${JSON.stringify(projectRoot)};

/* ── State ─────────────────────────────────────────────────────────────── */
const S = {
  console: [], network: [], actions: [],
  open: false, tab: 'console', dragging: false,
  inspecting: false, recording: false,
  lastElement: null,
  gitCache: null, gitFetched: false,
  videoRecording: false, videoRecorder: null, videoChunks: [], videoStart: null,
  videoBlob: null, videoTimer: null, videoElapsed: 0,
  ctx: {console:true,network:true,actions:true,element:true,git:true,har:false},
  networkExpanded: {},
  networkView: 'list',
  harFilter: 'all', harSearch: '',
  resizing: false, resizeEdge: null, moveMode: false,
  resizeStartX: 0, resizeStartY: 0, resizeStartW: 0, resizeStartH: 0,
  resizeStartR: 0, resizeStartB: 0,
  testGen: { status: 'idle', output: '', framework: '', filePath: '', lastErr: '', logs: [] },
  perf: { lcp: null, cls: 0, inp: null, fcp: null, longTasks: [] },
  routes: {},
  audit: { status: 'idle', progress: '', error: '' },
  deps: { checkInput: '', checkStatus: 'idle', checkResult: null, checkError: '', auditData: null, auditLoading: false, auditLimit: 10 },
};

// Current route tracking
var _routePath = location.pathname;
var _routeStart = Date.now();

/* Shadow DOM root — isolates widget CSS from host page */
var __shadow = null;
function $(id){ return __shadow ? __shadow.getElementById(id) : document.getElementById(id); }
function $$(sel){ return (__shadow || document).querySelectorAll(sel); }

/* ── Server communication ───────────────────────────────────────────────── */
function send(path, data){
  const url = AG_BASE + path;
  fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(()=>{});
}

// Ping page URL every 5 s
function pingUrl(){ send('/ping',{pageUrl:location.href}); }
pingUrl();
setInterval(pingUrl, 5000);

/* ── Console interception ───────────────────────────────────────────────── */
const _co = {error:console.error.bind(console),warn:console.warn.bind(console),log:console.log.bind(console),info:console.info.bind(console)};
function makeProxy(type){
  return function(...args){
    _co[type](...args);
    const msg = args.map(a=>{ try{ return typeof a==='object'?JSON.stringify(a):String(a); }catch(e){ return '[circular]'; }}).join(' ');
    const ev = {type,message:msg,timestamp:Date.now()};
    S.console.push(ev);
    if(S.console.length>200) S.console.shift();
    send('/console',ev);
    if(S.open && S.tab==='console') renderConsole();
    if(S.open && S.tab==='ai') renderContextBar();
    updateBadge();
  };
}
console.error = makeProxy('error');
console.warn  = makeProxy('warn');

window.addEventListener('error',function(e){
  const ev={type:'error',message:e.message||'Unknown error',stack:e.error&&e.error.stack,sourceUrl:e.filename,line:e.lineno,col:e.colno,timestamp:Date.now()};
  S.console.push(ev);
  if(S.console.length>200) S.console.shift();
  send('/console',ev);
  if(S.open && S.tab==='console') renderConsole();
  updateBadge();
});

window.addEventListener('unhandledrejection',function(e){
  const msg = e.reason&&e.reason.message ? 'Unhandled Promise: '+e.reason.message : 'Unhandled Promise Rejection';
  const ev={type:'error',message:msg,stack:e.reason&&e.reason.stack,timestamp:Date.now()};
  S.console.push(ev);
  if(S.console.length>200) S.console.shift();
  send('/console',ev);
  if(S.open && S.tab==='console') renderConsole();
  updateBadge();
});

/* ── Network interception ───────────────────────────────────────────────── */
function isAgUrl(url){ return url && String(url).includes('/__arcguard'); }

var SENSITIVE_HDRS=['authorization','cookie','set-cookie','x-api-key','x-auth-token','x-access-token','x-secret','proxy-authorization'];
function captureHeaders(headers){
  var result={};
  if(!headers) return result;
  try{
    if(typeof Headers!=='undefined' && headers instanceof Headers){
      headers.forEach(function(v,k){ result[k]=SENSITIVE_HDRS.indexOf(k.toLowerCase())>=0?'[REDACTED]':v; });
    } else {
      Object.keys(headers).forEach(function(k){ result[k]=SENSITIVE_HDRS.indexOf(k.toLowerCase())>=0?'[REDACTED]':headers[k]; });
    }
  }catch(e){}
  return result;
}

function pushNetworkEv(ev){
  S.network.push(ev);
  if(S.network.length>200) S.network.shift();
  send('/network',ev);
  if(S.open && S.tab==='network') renderNetwork();
  if(S.open && S.tab==='ai') renderContextBar();
  updateBadge();
}

const _fetch = window.fetch;
window.fetch = function(input, init){
  const url = input instanceof Request ? input.url : String(input);
  if(isAgUrl(url)) return _fetch.apply(this, arguments);
  const method = (init&&init.method||'GET').toUpperCase();
  const reqBody = init&&init.body ? String(init.body).slice(0,2000) : undefined;
  const reqHeaders = captureHeaders(init&&init.headers);
  const reqMime = reqHeaders['content-type']||reqHeaders['Content-Type']||'';
  const t0 = Date.now();
  return _fetch.apply(this, arguments).then(function(resp){
    const clone = resp.clone();
    const respHeaders = captureHeaders(resp.headers);
    const respMime = resp.headers.get('content-type')||'';
    clone.text().then(function(body){
      pushNetworkEv({method,url,status:resp.status,duration:Date.now()-t0,
        requestBody:reqBody,requestHeaders:reqHeaders,requestMimeType:reqMime,
        responseBody:body.slice(0,4000),responseHeaders:respHeaders,responseMimeType:respMime,
        responseSize:body.length,timestamp:Date.now()});
    }).catch(function(){
      pushNetworkEv({method,url,status:resp.status,duration:Date.now()-t0,
        requestHeaders:reqHeaders,responseHeaders:respHeaders,timestamp:Date.now()});
    });
    return resp;
  },function(err){
    pushNetworkEv({method,url,status:0,duration:Date.now()-t0,requestBody:reqBody,requestHeaders:reqHeaders,error:String(err),timestamp:Date.now()});
    throw err;
  });
};

const _open = XMLHttpRequest.prototype.open;
const _send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function(method,url){ this._ag={method:String(method).toUpperCase(),url:String(url)}; return _open.apply(this,arguments); };
XMLHttpRequest.prototype.send = function(body){
  if(this._ag && isAgUrl(this._ag.url)){ return _send.apply(this,arguments); }
  if(!this._ag){ return _send.apply(this,arguments); }
  const t0=Date.now(), ag=this._ag;
  ag.reqBody = body ? String(body).slice(0,2000) : undefined;
  this.addEventListener('loadend',function(){
    const respMime = this.getResponseHeader&&this.getResponseHeader('content-type')||'';
    pushNetworkEv({method:ag.method,url:ag.url,status:this.status,duration:Date.now()-t0,
      requestBody:ag.reqBody,responseBody:(this.responseText||'').slice(0,4000),
      responseMimeType:respMime,responseSize:this.responseText?this.responseText.length:0,
      timestamp:Date.now()});
  });
  return _send.apply(this,arguments);
};

/* ── Element Inspector ──────────────────────────────────────────────────── */
var _inspectOverlay = null;

function getReactComponent(el){
  var key = Object.keys(el).find(function(k){ return k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'); });
  if(!key) return null;
  var fiber = el[key];
  var chain = [];
  while(fiber){
    var type = fiber.type;
    if(type){
      var name = typeof type === 'string' ? type : (type.displayName || type.name || null);
      if(name && /^[A-Z]/.test(name)){
        var src = fiber._debugSource;
        chain.push({ name: name, file: src ? src.fileName : null, line: src ? src.lineNumber : null });
      }
    }
    fiber = fiber.return;
  }
  return chain.length ? chain : null;
}

function describeEl(el){
  var tag = el.tagName ? el.tagName.toLowerCase() : 'unknown';
  var id = el.id ? '#'+el.id : '';
  var cls = el.className && typeof el.className === 'string' ? '.'+el.className.trim().split(/\s+/).slice(0,2).join('.') : '';
  return tag + id + cls;
}

function captureElement(el){
  var r = el.getBoundingClientRect();
  var ancestors = [];
  var cur = el.parentElement;
  for(var i=0; i<5 && cur && cur !== document.body; i++, cur=cur.parentElement){
    ancestors.push(describeEl(cur));
  }
  var react = getReactComponent(el);
  var info = {
    tag: el.tagName ? el.tagName.toLowerCase() : 'unknown',
    id: el.id || undefined,
    className: el.className && typeof el.className === 'string' ? el.className.trim() : undefined,
    text: (el.textContent||'').trim().slice(0,200) || undefined,
    componentName: react && react[0] ? react[0].name : undefined,
    componentChain: react ? react.map(function(c){ return c.name; }) : undefined,
    sourceFile: react && react[0] ? react[0].file : undefined,
    sourceLine: react && react[0] ? react[0].line : undefined,
    ancestorPath: ancestors,
    rect: { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) },
    capturedAt: Date.now(),
  };
  S.lastElement = info;
  send('/element', info);
  if(S.open && S.tab === 'ai') renderContextBar();
  return info;
}

function startInspect(){
  S.inspecting = true;
  document.body.style.cursor = 'crosshair';
  _inspectOverlay = document.createElement('div');
  _inspectOverlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #0badbc;background:rgba(11,173,188,.08);border-radius:3px;z-index:2147483645;transition:all .05s;box-shadow:0 0 0 2000px rgba(0,0,0,.15)';
  document.body.appendChild(_inspectOverlay);
  document.addEventListener('mouseover', _onInspectHover, true);
  document.addEventListener('click', _onInspectClick, true);
  document.addEventListener('keydown', _onInspectKey, true);
}

function stopInspect(){
  S.inspecting = false;
  document.body.style.cursor = '';
  if(_inspectOverlay){ _inspectOverlay.remove(); _inspectOverlay = null; }
  document.removeEventListener('mouseover', _onInspectHover, true);
  document.removeEventListener('click', _onInspectClick, true);
  document.removeEventListener('keydown', _onInspectKey, true);
  updateInspectBtn();
}

function _onInspectHover(e){
  var el = e.target;
  if(!el || el.id === 'ag-panel' || el.id === 'ag-fab') return;
  var r = el.getBoundingClientRect();
  if(_inspectOverlay){
    _inspectOverlay.style.left = r.left + 'px';
    _inspectOverlay.style.top = r.top + 'px';
    _inspectOverlay.style.width = r.width + 'px';
    _inspectOverlay.style.height = r.height + 'px';
  }
}

function _onInspectClick(e){
  var el = e.target;
  if(!el || el.closest('#ag-panel') || el.id === 'ag-fab') return;
  e.preventDefault(); e.stopPropagation();
  captureElement(el);
  stopInspect();
  if(S.open) renderInspect();
  else { openPanel(); setTab('inspect'); }
}

function _onInspectKey(e){
  if(e.key === 'Escape') stopInspect();
}

function updateInspectBtn(){
  var btn = $('ag-inspect-btn');
  if(btn){ btn.style.background = S.inspecting ? 'rgba(11,173,188,.2)' : ''; btn.style.color = S.inspecting ? '#0badbc' : ''; }
}

/* ── Action Recorder ────────────────────────────────────────────────────── */
function sendAction(type, data){
  if(!S.recording) return;
  var ev = Object.assign({ type: type, timestamp: Date.now() }, data);
  S.actions.push(ev);
  if(S.actions.length > 200) S.actions.shift();
  send('/action', ev);
  if(S.open && S.tab === 'actions') renderActions();
  if(S.open && S.tab === 'ai') renderContextBar();
}

function startRecording(){
  S.recording = true;
  S.actions = [];
  sendAction('navigation', { url: location.href });
  document.addEventListener('click', _onRecordClick, true);
  document.addEventListener('input', _onRecordInput, true);
  document.addEventListener('submit', _onRecordSubmit, true);
  var origPush = history.pushState.bind(history);
  history.pushState = function(){ origPush.apply(history, arguments); sendAction('navigation', { url: location.href }); };
  updateRecordBtn();
}

function stopRecording(){
  S.recording = false;
  document.removeEventListener('click', _onRecordClick, true);
  document.removeEventListener('input', _onRecordInput, true);
  document.removeEventListener('submit', _onRecordSubmit, true);
  updateRecordBtn();
}

function _onRecordClick(e){
  var el = e.target;
  if(!el || el.closest('#ag-panel') || el.id === 'ag-fab') return;
  sendAction('click', { target: describeEl(el), value: (el.textContent||'').trim().slice(0,80) });
}

function _onRecordInput(e){
  var el = e.target;
  if(!el) return;
  var val = (el.type === 'password') ? '***' : (el.value||'').slice(0,100);
  sendAction('input', { target: describeEl(el), value: val });
}

function _onRecordSubmit(e){
  var el = e.target;
  sendAction('submit', { target: el ? describeEl(el) : 'form' });
}

function updateRecordBtn(){
  var btn = $('ag-record-btn');
  if(btn){
    btn.style.background = S.recording ? 'rgba(248,81,73,.15)' : '';
    btn.style.color = S.recording ? '#f85149' : '';
    btn.textContent = S.recording ? '⏹' : '⏺';
    btn.title = S.recording ? 'Stop recording' : 'Record user actions';
  }
}

/* ── Performance observers ──────────────────────────────────────────────── */
function initPerfObservers(){
  try{
    new PerformanceObserver(function(list){
      var entries=list.getEntries();
      if(entries.length) S.perf.lcp=Math.round(entries[entries.length-1].startTime);
    }).observe({type:'largest-contentful-paint',buffered:true});
  }catch(e){}

  try{
    var _clsVal=0;
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){ if(!e.hadRecentInput){ _clsVal+=e.value; S.perf.cls=Math.round(_clsVal*1000)/1000; } });
    }).observe({type:'layout-shift',buffered:true});
  }catch(e){}

  try{
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){
        S.perf.longTasks.push({duration:e.duration,startTime:e.startTime});
        if(S.perf.longTasks.length>50) S.perf.longTasks.shift();
      });
    }).observe({type:'longtask',buffered:true});
  }catch(e){}

  try{
    var _maxInp=0;
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){ if(e.duration>_maxInp){ _maxInp=e.duration; S.perf.inp=Math.round(e.duration); } });
    }).observe({type:'event',durationThreshold:40,buffered:true});
  }catch(e){}

  try{
    var _paints=performance.getEntriesByType('paint');
    _paints.forEach(function(e){ if(e.name==='first-contentful-paint') S.perf.fcp=Math.round(e.startTime); });
    if(!S.perf.fcp){
      new PerformanceObserver(function(list){
        list.getEntries().forEach(function(e){ if(e.name==='first-contentful-paint') S.perf.fcp=Math.round(e.startTime); });
      }).observe({type:'paint',buffered:true});
    }
  }catch(e){}
}

function getPerfData(){
  var navEntries=performance.getEntriesByType('navigation');
  var nav=navEntries&&navEntries.length?navEntries[0]:null;
  var navTiming=nav?{
    dns:Math.round(nav.domainLookupEnd-nav.domainLookupStart),
    tcp:Math.round(nav.connectEnd-nav.connectStart),
    ttfb:Math.round(nav.responseStart-nav.requestStart),
    domReady:Math.round(nav.domContentLoadedEventEnd),
    load:Math.round(nav.loadEventEnd),
    type:nav.type
  }:null;

  // Update FCP from paint entries (may be available now even if observer missed it)
  try{
    performance.getEntriesByType('paint').forEach(function(e){
      if(e.name==='first-contentful-paint') S.perf.fcp=Math.round(e.startTime);
    });
  }catch(e){}

  var resEntries=[];
  try{ resEntries=performance.getEntriesByType('resource')||[]; }catch(e){}
  var largeSorted=resEntries
    .filter(function(r){ return r.transferSize>50000; })
    .sort(function(a,b){ return b.transferSize-a.transferSize; })
    .slice(0,5)
    .map(function(r){
      var parts=r.name.split('/'); var fname=parts[parts.length-1].split('?')[0];
      return {name:fname||r.name,size:r.transferSize,duration:Math.round(r.duration)};
    });

  var apiReqs=S.network.filter(function(r){ return !r.url.includes('/__arcguard'); });
  var total=apiReqs.length;
  var errors=apiReqs.filter(function(r){ return r.status===0||r.status>=400; }).length;
  var avgDur=total?Math.round(apiReqs.reduce(function(s,r){ return s+r.duration; },0)/total):0;
  var slowest=apiReqs.slice().sort(function(a,b){ return b.duration-a.duration; }).slice(0,5);

  var urlCount={};
  apiReqs.forEach(function(r){ var k=r.method+' '+r.url.split('?')[0]; urlCount[k]=(urlCount[k]||0)+1; });
  var repeated=Object.keys(urlCount)
    .filter(function(k){ return urlCount[k]>1; })
    .map(function(k){ return [k,urlCount[k]]; })
    .sort(function(a,b){ return b[1]-a[1]; })
    .slice(0,5);

  // Sequential chain detection — requests where each starts after the previous ends
  var sorted=apiReqs.slice().sort(function(a,b){ return (a.timestamp-a.duration)-(b.timestamp-b.duration); });
  var seqCount=0;
  for(var i=1;i<sorted.length;i++){
    var prevEnd=sorted[i-1].timestamp;
    var curStart=sorted[i].timestamp-sorted[i].duration;
    if(curStart>=prevEnd-100) seqCount++;
  }

  return {
    navTiming:navTiming,fcp:S.perf.fcp,lcp:S.perf.lcp,cls:S.perf.cls,inp:S.perf.inp,
    longTasks:S.perf.longTasks,largeSorted:largeSorted,
    total:total,errors:errors,avgDur:avgDur,slowest:slowest,repeated:repeated,seqCount:seqCount
  };
}

/* ── UI construction ────────────────────────────────────────────────────── */
const CSS = \`
#ag-root *{box-sizing:border-box;margin:0;padding:0}
#ag-fab{position:fixed;bottom:24px;right:24px;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#0badbc,#0078d7);color:#fff;font-size:13px;font-weight:700;font-family:system-ui,sans-serif;border:none;cursor:pointer;z-index:2147483646;box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;transition:transform .15s}
#ag-fab:hover{transform:scale(1.08)}
#ag-badge{position:absolute;top:-4px;right:-4px;background:#f85149;color:#fff;font-size:9px;font-weight:700;border-radius:10px;min-width:16px;height:16px;line-height:16px;padding:0 4px;text-align:center;display:none}
#ag-panel{position:fixed;bottom:76px;right:24px;width:360px;height:480px;min-width:300px;min-height:280px;max-width:90vw;max-height:90vh;background:#0d1117;border:1px solid #30363d;border-radius:12px;z-index:2147483646;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.5);font-family:system-ui,sans-serif;font-size:12px;color:#c9d1d9;overflow:hidden;transition:opacity .15s,transform .15s}
.ag-rz{position:absolute;z-index:20;transition:background .12s}
.ag-rz:hover{background:rgba(11,173,188,.18)}
#ag-rz-n{top:0;left:8px;right:8px;height:5px;cursor:ns-resize}
#ag-rz-s{bottom:0;left:8px;right:8px;height:5px;cursor:ns-resize}
#ag-rz-w{left:0;top:8px;bottom:8px;width:5px;cursor:ew-resize}
#ag-rz-e{right:0;top:8px;bottom:8px;width:5px;cursor:ew-resize}
#ag-rz-nw{top:0;left:0;width:10px;height:10px;cursor:nwse-resize;z-index:21}
#ag-rz-ne{top:0;right:0;width:10px;height:10px;cursor:nesw-resize;z-index:21}
#ag-rz-sw{bottom:0;left:0;width:10px;height:10px;cursor:nesw-resize;z-index:21}
#ag-rz-se{bottom:0;right:0;width:10px;height:10px;cursor:nwse-resize;z-index:21}
#ag-panel.ag-move-mode{cursor:move;box-shadow:0 0 0 2px #0badbc,0 8px 32px rgba(0,0,0,.5)}
#ag-panel.ag-move-mode #ag-ph::after{content:'↖↗↙↘ drag to move · dbl-click to exit';font-size:9px;color:#0badbc;margin-left:auto;padding-left:8px}
#ag-panel.ag-hidden{opacity:0;transform:translateY(8px);pointer-events:none}
#ag-ph{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid #21262d;background:#161b22;flex-shrink:0;user-select:none;cursor:move}
#ag-ph-logo{width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#0badbc,#0078d7);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;margin-right:8px}
#ag-ph-title{font-size:12px;font-weight:600;color:#e6edf3;flex:1}
#ag-ph-url{font-size:10px;color:#c9d1d9;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#ag-close{width:24px;height:24px;border:none;background:none;color:#c9d1d9;cursor:pointer;font-size:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1}
#ag-close:hover{color:#c9d1d9;background:rgba(139,148,158,.1)}
#ag-tabs{display:flex;border-bottom:1px solid #21262d;flex-shrink:0;background:#161b22}
.ag-tab{flex:1;padding:7px 0;border:none;background:none;color:#c9d1d9;cursor:pointer;font-size:11px;font-weight:500;border-bottom:2px solid transparent;transition:all .1s;font-family:inherit}
.ag-tab:hover{color:#c9d1d9}
.ag-tab.ag-active{color:#0badbc;border-bottom-color:#0badbc}
.ag-tab-badge{display:inline-block;background:rgba(248,81,73,.15);color:#f85149;border-radius:8px;padding:0 5px;font-size:9px;font-weight:700;margin-left:3px;line-height:14px}
#ag-body{flex:1;overflow:hidden;display:flex;flex-direction:column}
#ag-content{flex:1;overflow-y:auto;padding:8px 0}
#ag-content::-webkit-scrollbar{width:4px}
#ag-content::-webkit-scrollbar-track{background:transparent}
#ag-content::-webkit-scrollbar-thumb{background:#30363d;border-radius:2px}
.ag-empty{color:#c9d1d9;font-size:11px;text-align:center;padding:40px 16px}
.ag-ev{padding:8px 14px;border-bottom:1px solid #21262d;cursor:pointer;transition:background .1s}
.ag-ev:hover{background:#161b22}
.ag-ev:last-child{border-bottom:none}
.ag-ev-hdr{display:flex;align-items:center;gap:6px;margin-bottom:3px}
.ag-pill{font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px;flex-shrink:0}
.ag-pill-error{background:rgba(248,81,73,.15);color:#f85149}
.ag-pill-warn{background:rgba(210,153,34,.15);color:#d29922}
.ag-pill-log{background:rgba(56,139,253,.1);color:#388bfd}
.ag-ev-msg{font-size:11px;color:#c9d1d9;word-break:break-word;line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ag-ev-stack{font-size:10px;color:#c9d1d9;margin-top:3px;font-family:monospace;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4}
.ag-ev-time{font-size:9px;color:#c9d1d9;margin-left:auto;flex-shrink:0}
.ag-net-ev{border-bottom:1px solid #21262d;cursor:pointer;user-select:none}
.ag-net-ev:hover .ag-net-row{background:rgba(255,255,255,.025)}
.ag-net-row{display:flex;flex-direction:column;padding:7px 14px}
.ag-net-hdr{display:flex;align-items:center;gap:6px}
.ag-net-toggle{font-size:9px;color:#c9d1d9;flex-shrink:0;width:10px}
.ag-method{font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:#21262d;color:#c9d1d9;flex-shrink:0}
.ag-net-url{font-size:11px;color:#c9d1d9;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ag-status-ok{color:#3fb950}
.ag-status-warn{color:#d29922}
.ag-status-err{color:#f85149}
.ag-status-0{color:#c9d1d9}
.ag-net-meta{font-size:10px;color:#c9d1d9;margin-top:2px;padding-left:16px}
.ag-net-detail{background:#0a0e13;border-top:1px solid #21262d}
.ag-nd-section{border-bottom:1px solid #161b22}
.ag-nd-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#c9d1d9;padding:6px 14px 3px}
.ag-nd-kv{display:flex;gap:0;padding:1px 14px;font-size:10px;line-height:1.6}
.ag-nd-k{color:#c9d1d9;flex-shrink:0;width:130px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ag-nd-v{color:#c9d1d9;font-family:monospace;word-break:break-all;flex:1}
.ag-nd-v.redacted{color:#6e7681;font-style:italic}
.ag-nd-body{font-family:monospace;font-size:10px;color:#c9d1d9;padding:4px 14px 8px;white-space:pre-wrap;word-break:break-word;max-height:180px;overflow-y:auto;line-height:1.5}
.ag-nd-err{font-size:10px;color:#f85149;padding:4px 14px 8px;font-family:monospace}
.ag-net-view-bar{display:flex;gap:0;padding:6px 10px;border-bottom:1px solid #21262d;flex-shrink:0;background:#0d1117}
.ag-net-view-btn{font-size:10px;padding:3px 10px;border:1px solid #30363d;background:none;color:#c9d1d9;cursor:pointer;font-family:inherit;transition:all .1s}
.ag-net-view-btn:first-child{border-radius:6px 0 0 6px}
.ag-net-view-btn:last-child{border-radius:0 6px 6px 0;border-left:none}
.ag-net-view-btn.active{background:rgba(11,173,188,.12);color:#0badbc;border-color:#0badbc}
.ag-wf-summary{display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid #21262d;background:#0d1117;flex-wrap:wrap;flex-shrink:0}
.ag-wf-stat{font-size:9px;font-weight:600;padding:2px 7px;border-radius:10px;background:#21262d;color:#c9d1d9}
.ag-wf-stat-err{color:#f85149;background:rgba(248,81,73,.1)}
.ag-wf-filters{display:flex;align-items:center;gap:6px;padding:5px 10px;border-bottom:1px solid #21262d;flex-shrink:0}
.ag-wf-flt{font-size:10px;padding:2px 9px;border-radius:10px;border:1px solid #30363d;background:none;color:#c9d1d9;cursor:pointer;font-family:inherit;transition:all .1s}
.ag-wf-flt.active{background:rgba(11,173,188,.12);color:#0badbc;border-color:rgba(11,173,188,.5)}
.ag-wf-search{flex:1;background:#161b22;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;font-size:10px;padding:3px 8px;outline:none;font-family:inherit}
.ag-wf-search:focus{border-color:#0badbc}
.ag-wf-row{display:flex;align-items:stretch;border-bottom:1px solid #30363d;cursor:pointer;min-height:26px;transition:background .08s}
.ag-wf-row:hover .ag-wf-meta{background:rgba(255,255,255,.02)}
.ag-wf-row:hover .ag-wf-tl{background:rgba(255,255,255,.01)}
.ag-wf-row.row-open .ag-wf-meta{background:rgba(11,173,188,.04)}
.ag-wf-row.row-open .ag-wf-tl{background:rgba(11,173,188,.02)}
.ag-wf-meta{width:190px;flex-shrink:0;display:flex;align-items:center;gap:0;padding:0 6px 0 10px;overflow:hidden;border-right:1px solid #21262d}
.ag-wf-tl{flex:1;position:relative;overflow:hidden;min-width:0}
.ag-wf-tl-inner{position:relative;height:100%;width:100%;min-height:26px}
.ag-wf-gridline{position:absolute;top:0;bottom:0;width:1px;background:#30363d;pointer-events:none}
.ag-wf-bar{position:absolute;top:50%;transform:translateY(-50%);height:12px;border-radius:2px;min-width:3px}
.ag-wf-bar-lbl{position:absolute;top:50%;transform:translateY(-50%);font-size:8px;font-family:monospace;white-space:nowrap;pointer-events:none;padding-left:3px}
.wf-2xx{background:#3fb950}.wf-3xx{background:#d29922}.wf-4xx{background:#f85149}.wf-5xx{background:rgba(248,81,73,.7)}.wf-0{background:#6e7681}
.wf-2xx+.ag-wf-bar-lbl{color:#3fb950}.wf-3xx+.ag-wf-bar-lbl{color:#d29922}.wf-4xx+.ag-wf-bar-lbl,.wf-5xx+.ag-wf-bar-lbl{color:#f85149}.wf-0+.ag-wf-bar-lbl{color:#c9d1d9}
.ag-wf-axis{display:flex;border-bottom:1px solid #30363d;flex-shrink:0;font-size:9px;font-family:monospace;font-weight:700;background:#161b22}
.ag-wf-axis-left{width:190px;flex-shrink:0;padding:4px 6px 4px 10px;border-right:1px solid #30363d;font-size:10px;font-weight:700;color:#c9d1d9;letter-spacing:.3px}
.ag-wf-axis-right{flex:1;position:relative;height:22px}
.ag-wf-axis-tick{position:absolute;top:4px;transform:translateX(-50%);white-space:nowrap;color:#c9d1d9;font-size:9px;font-weight:700}
.ag-wf-axis-tick:first-child{transform:none}
.ag-wf-axis-tick:last-child{transform:translateX(-100%)}
.ag-wf-hdr-meta{width:190px;flex-shrink:0;display:flex;align-items:center;padding:4px 6px 4px 10px;border-right:1px solid #21262d}
.ag-wf-hdr-tl{flex:1;padding:4px 6px;font-size:9px;color:#c9d1d9;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.ag-wf-hst{width:28px;flex-shrink:0;font-size:9px;font-weight:700}
.ag-wf-hmt{width:38px;flex-shrink:0;font-size:9px}
.ag-wf-hpath{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;color:#c9d1d9;padding-right:4px}
.ag-wf-hsz{width:38px;flex-shrink:0;font-size:9px;color:#c9d1d9;text-align:right}
.ag-wf-detail-wrap{border-bottom:1px solid #21262d}
.ag-btn{padding:5px 12px;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#c9d1d9;font-size:11px;cursor:pointer;font-family:inherit;transition:all .1s}
.ag-btn:hover{border-color:#c9d1d9;color:#e6edf3}
.ag-btn-primary{background:linear-gradient(135deg,#0badbc,#0078d7);border-color:transparent;color:#fff;font-weight:600}
.ag-btn-primary:hover{opacity:.9}
#ag-ai{display:flex;flex-direction:column;height:100%;padding:0}
#ag-chat-msgs{flex:1;overflow-y:auto;padding:8px 0}
#ag-chat-msgs::-webkit-scrollbar{width:4px}
#ag-chat-msgs::-webkit-scrollbar-thumb{background:#30363d;border-radius:2px}
#ag-chat-input-row{display:flex;gap:6px;padding:8px 10px;border-top:1px solid #21262d;flex-shrink:0;align-items:flex-end}
#ag-ai-q{flex:1;background:#161b22;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;font-size:11px;font-family:system-ui,sans-serif;padding:6px 8px;resize:none;outline:none;line-height:1.5;max-height:80px}
#ag-ai-q:focus{border-color:#0badbc}
#ag-send-btn{width:28px;height:28px;padding:0;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px}
#ag-send-btn:disabled{opacity:.5;cursor:not-allowed}
#ag-chat-hint{font-size:9px;color:#c9d1d9;padding:0 10px 6px;flex-shrink:0}
#ag-ctx-bar{display:flex;flex-wrap:wrap;gap:4px;padding:6px 10px;border-top:1px solid #21262d;flex-shrink:0;min-height:28px;align-items:center}
.ctx-chip{font-size:9px;font-weight:600;padding:2px 7px;border-radius:10px;white-space:nowrap}
.chip-err{background:rgba(248,81,73,.12);color:#f85149;border:1px solid rgba(248,81,73,.25)}
.chip-warn{background:rgba(210,153,34,.12);color:#d29922;border:1px solid rgba(210,153,34,.25)}
.chip-act{background:rgba(63,185,80,.12);color:#3fb950;border:1px solid rgba(63,185,80,.25)}
.chip-el{background:rgba(11,173,188,.12);color:#0badbc;border:1px solid rgba(11,173,188,.25)}
.chip-git{background:rgba(139,148,158,.1);color:#c9d1d9;border:1px solid rgba(139,148,158,.2)}
.ctx-none{font-size:9px;color:#c9d1d9;font-style:italic}
.ctx-toggle{font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap;border:1px solid #30363d;background:#161b22;color:#c9d1d9;cursor:pointer;font-family:inherit;transition:all .15s;opacity:.7}
.ctx-toggle.active{opacity:1}
.ctx-toggle.active.t-err{background:rgba(248,81,73,.12);color:#f85149;border-color:rgba(248,81,73,.3)}
.ctx-toggle.active.t-warn{background:rgba(210,153,34,.12);color:#d29922;border-color:rgba(210,153,34,.3)}
.ctx-toggle.active.t-act{background:rgba(63,185,80,.12);color:#3fb950;border-color:rgba(63,185,80,.3)}
.ctx-toggle.active.t-el{background:rgba(11,173,188,.12);color:#0badbc;border-color:rgba(11,173,188,.3)}
.ctx-toggle.active.t-git{background:rgba(139,148,158,.12);color:#c9d1d9;border-color:rgba(139,148,158,.3)}
.ctx-toggle.active.t-har{background:rgba(139,148,158,.12);color:#c9d1d9;border-color:rgba(139,148,158,.3)}
.ag-msg{padding:8px 14px;border-bottom:1px solid #21262d}
.ag-msg-label{font-size:9px;font-weight:700;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}
.ag-msg-user .ag-msg-label{color:#0badbc}
.ag-msg-claude .ag-msg-label{color:#3fb950}
.ag-msg-body{font-size:11px;color:#c9d1d9;white-space:pre-wrap;word-break:break-word;line-height:1.5}
#ag-toolbar{display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid #21262d;background:#0d1117;flex-shrink:0}
.ag-tool-btn{width:28px;height:28px;border:1px solid #30363d;background:none;border-radius:5px;color:#c9d1d9;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .1s}
.ag-tool-btn:hover{border-color:#c9d1d9;color:#c9d1d9}
.ag-inspect-info{padding:10px 14px;border-bottom:1px solid #21262d}
.ag-inspect-el{font-family:monospace;font-size:11px;color:#0badbc;margin-bottom:6px}
.ag-inspect-row{display:flex;gap:6px;margin-bottom:3px;font-size:11px}
.ag-inspect-key{color:#c9d1d9;flex-shrink:0;width:90px}
.ag-inspect-val{color:#c9d1d9;word-break:break-word}
.ag-inspect-chain{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.ag-chain-pill{font-size:9px;padding:1px 7px;border-radius:10px;background:rgba(11,173,188,.1);color:#0badbc;border:1px solid rgba(11,173,188,.2)}
.ag-action-row{display:flex;align-items:center;gap:8px;padding:6px 14px;border-bottom:1px solid #21262d;font-size:11px}
.ag-action-type{font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px;flex-shrink:0;min-width:58px;text-align:center}
.ag-action-nav{background:rgba(56,139,253,.1);color:#388bfd}
.ag-action-click{background:rgba(63,185,80,.1);color:#3fb950}
.ag-action-input{background:rgba(210,153,34,.1);color:#d29922}
.ag-action-submit{background:rgba(139,148,158,.1);color:#c9d1d9}
.ag-action-val{flex:1;color:#c9d1d9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ag-action-time{font-size:9px;color:#c9d1d9;flex-shrink:0}
.ag-git-section{padding:10px 14px;border-bottom:1px solid #21262d}
.ag-git-title{font-size:10px;font-weight:700;color:#e6edf3;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.ag-git-commit{font-family:monospace;font-size:10px;color:#c9d1d9;line-height:1.6}
.ag-git-stat{font-family:monospace;font-size:10px;color:#c9d1d9;margin-top:4px;white-space:pre-wrap}
.ag-tg-section{border-top:1px solid #30363d;padding-top:10px;display:flex;flex-direction:column;gap:7px}
.ag-tg-title{font-size:10px;font-weight:700;color:#e6edf3;text-transform:uppercase;letter-spacing:.5px;display:flex;align-items:center;gap:6px}
.ag-tg-fw{font-size:9px;font-weight:600;padding:2px 7px;border-radius:10px;background:rgba(56,139,253,.12);color:#388bfd;border:1px solid rgba(56,139,253,.3)}
.ag-tg-terminal{background:#0a0e13;border:1px solid #30363d;border-radius:6px 6px 0 0;font-family:monospace;font-size:9px;color:#c9d1d9;padding:6px 10px;white-space:pre-wrap;word-break:break-all;max-height:100px;overflow-y:auto;line-height:1.6;border-bottom:none}
.ag-tg-terminal::-webkit-scrollbar{width:3px}
.ag-tg-terminal::-webkit-scrollbar-thumb{background:#30363d;border-radius:2px}
.ag-tg-terminal .tg-log{color:#c9d1d9}
.ag-tg-terminal .tg-ok{color:#3fb950}
.ag-tg-terminal .tg-err{color:#f85149}
.ag-tg-code{background:#0a0e13;border:1px solid #30363d;border-radius:0 0 6px 6px;font-family:monospace;font-size:10px;color:#c9d1d9;padding:8px 10px;white-space:pre-wrap;word-break:break-all;max-height:180px;overflow-y:auto;line-height:1.5;border-top:1px solid #21262d}
.ag-tg-code-only{border-radius:6px}
.ag-tg-code::-webkit-scrollbar{width:3px}
.ag-tg-code::-webkit-scrollbar-thumb{background:#30363d;border-radius:2px}
.ag-tg-blink{display:inline-block;width:6px;height:11px;background:#0badbc;margin-left:2px;animation:ag-blink .7s steps(1) infinite;vertical-align:text-bottom}
@keyframes ag-blink{0%,100%{opacity:1}50%{opacity:0}}
.ag-tg-footer{font-size:9px;color:#3fb950;font-family:monospace;display:flex;align-items:center;gap:4px}
.ag-tg-err-box{font-size:10px;color:#f85149;font-family:monospace;padding:6px 10px;background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.2);border-radius:6px}
.ag-tg-stage2{border-top:1px solid #21262d;padding-top:8px;display:flex;flex-direction:column;gap:6px}
.ag-tg-stage2-title{font-size:9px;font-weight:700;color:#c9d1d9;text-transform:uppercase;letter-spacing:.5px}
.ag-tg-actions{display:flex;gap:6px;flex-wrap:wrap}
.ag-tg-verdict{padding:8px 10px;border-radius:6px;font-size:10px;font-family:monospace;line-height:1.7}
.ag-tg-verdict.pass{background:rgba(63,185,80,.1);border:1px solid rgba(63,185,80,.3);color:#3fb950}
.ag-tg-verdict.fail{background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.2);color:#f85149}
.ag-tg-verdict.verified{background:rgba(63,185,80,.12);border:1px solid rgba(63,185,80,.4);color:#3fb950}
.ag-tg-step{font-size:9px;color:#c9d1d9;padding:2px 0}
.ag-tg-step.ok{color:#3fb950}
.ag-tg-step.err{color:#f85149}
.ag-tg-step.active{color:#0badbc}
.ag-perf-section{border-top:1px solid #21262d;padding-top:8px;display:flex;flex-direction:column;gap:5px}
.ag-perf-title{font-size:10px;font-weight:700;color:#e6edf3;text-transform:uppercase;letter-spacing:.5px;display:flex;align-items:center;gap:6px}
.ag-perf-count{font-size:10px;font-weight:600;padding:0 5px;border-radius:8px;background:#21262d;color:#c9d1d9}
.ag-perf-err{font-size:9px;font-weight:600;padding:0 5px;border-radius:8px;background:rgba(248,81,73,.12);color:#f85149}
.ag-perf-subtitle{font-size:9px;font-weight:700;color:#c9d1d9;text-transform:uppercase;letter-spacing:.4px;margin-top:3px}
.ag-perf-warn{font-size:10px;color:#d29922;background:rgba(210,153,34,.08);border:1px solid rgba(210,153,34,.2);border-radius:5px;padding:4px 8px}
.ag-perf-row{display:flex;align-items:center;gap:5px;font-size:10px;padding:2px 0;border-bottom:1px solid #161b22}
.ag-perf-ri{color:#c9d1d9;width:14px;flex-shrink:0}
.ag-perf-url{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#c9d1d9;font-family:monospace;font-size:9px}
.ag-perf-dur{font-weight:600;flex-shrink:0}
.ag-perf-badge{font-size:9px;font-weight:700;padding:0 6px;border-radius:8px;background:#21262d;color:#c9d1d9;flex-shrink:0;white-space:nowrap}
.ag-perf-badge.ag-perf-poor{background:rgba(248,81,73,.12);color:#f85149}
.ag-perf-vitals{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px}
.ag-perf-vital{background:#161b22;border-radius:6px;padding:6px 4px;text-align:center;border:1px solid #21262d}
.ag-perf-vname{font-size:9px;font-weight:700;color:#c9d1d9;text-transform:uppercase;margin-bottom:3px}
.ag-perf-vval{font-size:11px;font-weight:700;color:#e6edf3}
.ag-perf-good{border-color:rgba(63,185,80,.25);background:rgba(63,185,80,.06)}
.ag-perf-good .ag-perf-vval{color:#3fb950}
.ag-perf-needs{border-color:rgba(210,153,34,.25);background:rgba(210,153,34,.06)}
.ag-perf-needs .ag-perf-vval{color:#d29922}
.ag-perf-poor{border-color:rgba(248,81,73,.25);background:rgba(248,81,73,.06)}
.ag-perf-poor .ag-perf-vval{color:#f85149}
.ag-perf-na .ag-perf-vval{color:#c9d1d9}
.ag-rt-table{width:100%;border-collapse:collapse;font-size:10px}
.ag-rt-th{font-size:9px;font-weight:700;color:#c9d1d9;text-transform:uppercase;letter-spacing:.4px;padding:5px 6px;text-align:left;border-bottom:1px solid #30363d;white-space:nowrap}
.ag-rt-td{padding:5px 6px;border-bottom:1px solid #161b22;color:#c9d1d9;vertical-align:middle}
.ag-rt-path{font-family:monospace;color:#e6edf3;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ag-rt-good{color:#3fb950}.ag-rt-needs{color:#d29922}.ag-rt-poor{color:#f85149}
.ag-rt-score{display:inline-block;font-size:9px;font-weight:700;padding:1px 7px;border-radius:10px;min-width:28px;text-align:center}
.ag-rt-score.ag-rt-good{background:rgba(63,185,80,.12);color:#3fb950;border:1px solid rgba(63,185,80,.25)}
.ag-rt-score.ag-rt-needs{background:rgba(210,153,34,.12);color:#d29922;border:1px solid rgba(210,153,34,.25)}
.ag-rt-score.ag-rt-poor{background:rgba(248,81,73,.1);color:#f85149;border:1px solid rgba(248,81,73,.2)}
.ag-rt-audit{display:flex;align-items:center;gap:6px;padding:6px 0;font-size:10px;color:#c9d1d9;border-top:1px solid #21262d;margin-top:4px}
.ag-dep-check{display:flex;gap:6px;margin-bottom:10px}
.ag-dep-input{flex:1;background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font-size:12px;padding:6px 9px;font-family:monospace;outline:none}
.ag-dep-input:focus{border-color:#0badbc}
.ag-dep-btn{background:#0badbc;border:none;border-radius:5px;color:#fff;font-size:11px;font-weight:700;padding:6px 12px;cursor:pointer;white-space:nowrap}
.ag-dep-btn:hover{background:#0a9da9}
.ag-dep-card{background:#161b22;border:1px solid #30363d;border-radius:6px;margin-bottom:10px;overflow:hidden}
.ag-dep-card-hdr{padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #21262d}
.ag-dep-name{font-size:12px;font-weight:700;color:#e6edf3;font-family:monospace}
.ag-dep-version{font-size:10px;color:#c9d1d9;margin-left:5px}
.ag-dep-verdict{font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px;letter-spacing:.04em}
.ag-dep-adopt{background:rgba(63,185,80,.14);color:#3fb950;border:1px solid rgba(63,185,80,.25)}
.ag-dep-review{background:rgba(210,153,34,.12);color:#d29922;border:1px solid rgba(210,153,34,.25)}
.ag-dep-reject{background:rgba(248,81,73,.1);color:#f85149;border:1px solid rgba(248,81,73,.2)}
.ag-dep-body{padding:10px 12px}
.ag-dep-score-row{display:grid;grid-template-columns:80px 1fr 40px;align-items:center;gap:8px;margin-bottom:5px;font-size:10px}
.ag-dep-score-label{color:#c9d1d9}
.ag-dep-bar-wrap{height:4px;background:#21262d;border-radius:2px;overflow:hidden}
.ag-dep-bar{height:100%;border-radius:2px}
.ag-dep-score-val{color:#8b949e;text-align:right;font-variant-numeric:tabular-nums}
.ag-dep-flags{font-size:10px;color:#d29922;background:rgba(210,153,34,.08);border:1px solid rgba(210,153,34,.2);border-radius:4px;padding:5px 8px;margin-top:7px}
.ag-dep-reject-flag{color:#f85149;background:rgba(248,81,73,.08);border-color:rgba(248,81,73,.2)}
.ag-dep-meta{font-size:9px;color:#8b949e;margin-top:6px;display:flex;gap:10px;flex-wrap:wrap}
.ag-dep-audit-title{font-size:10px;font-weight:700;color:#e6edf3;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.ag-dep-limit-btn{background:#21262d;border:1px solid #30363d;border-radius:4px;color:#8b949e;font-size:10px;font-weight:600;padding:2px 7px;cursor:pointer;font-family:inherit;transition:all .15s}
.ag-dep-limit-btn:hover{border-color:#0badbc;color:#0badbc}
.ag-dep-limit-active{background:rgba(11,173,188,.15);border-color:#0badbc;color:#0badbc}
.ag-dep-loading{font-size:11px;color:#8b949e;text-align:center;padding:20px 0}
\`;

function inject(){
  // Shadow host — sits outside layout flow, never blocks clicks on host page
  const host=document.createElement('div');
  host.setAttribute('id','ag-shadow-host');
  host.style.cssText='all:initial;position:fixed;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483647';
  document.body.appendChild(host);
  __shadow=host.attachShadow({mode:'open'});

  // Inject CSS inside shadow (completely isolated from host page)
  const style=document.createElement('style');
  style.textContent=CSS;
  __shadow.appendChild(style);

  // FAB
  const fab=document.createElement('button');
  fab.id='ag-fab';
  fab.innerHTML='<span>AG</span><span id="ag-badge"></span>';
  fab.title='ArchGuard DevTools';
  fab.style.pointerEvents='auto';
  fab.addEventListener('click',togglePanel);
  __shadow.appendChild(fab);

  // Panel
  const panel=document.createElement('div');
  panel.id='ag-panel';
  panel.className='ag-hidden';
  panel.style.pointerEvents='auto';
  panel.innerHTML=\`
<div id="ag-ph">
  <div id="ag-ph-logo">AG</div>
  <span id="ag-ph-title">ArchGuard</span>
  <span id="ag-ph-url"></span>
  <button id="ag-close" title="Close">✕</button>
</div>
<div id="ag-toolbar">
  <button class="ag-tool-btn" id="ag-inspect-btn" title="Inspect element (click to pick)">🔍</button>
  <button class="ag-tool-btn" id="ag-record-btn" title="Record user actions">⏺</button>
  <button class="ag-tool-btn" id="ag-video-btn" title="Screen recording (HAR + video)">🎥</button>
  <span id="ag-vid-timer" style="display:none;align-items:center;gap:4px;font-size:10px;font-weight:600;color:#f85149;margin-left:4px">⏺ <span id="ag-vid-elapsed">0:00</span></span>
</div>
<div id="ag-tabs">
  <button class="ag-tab ag-active" data-tab="console">Console</button>
  <button class="ag-tab" data-tab="network">Network</button>
  <button class="ag-tab" data-tab="inspect">Inspect</button>
  <button class="ag-tab" data-tab="actions">Actions</button>
  <button class="ag-tab" data-tab="ai">AI Chat</button>
  <button class="ag-tab" data-tab="perf">Perf</button>
  <button class="ag-tab" data-tab="deps">Deps</button>
  <button class="ag-tab" data-tab="export">Export</button>
</div>
<div id="ag-body">
  <div id="ag-content"></div>
</div>
\`;
  __shadow.appendChild(panel);

  // Events
  $('ag-close').addEventListener('click',closePanel);
  $$('.ag-tab').forEach(function(t){
    t.addEventListener('click',function(){ setTab(t.dataset.tab); });
  });

  $('ag-inspect-btn').addEventListener('click',function(){
    if(S.inspecting) stopInspect(); else { closePanel(); startInspect(); }
  });
  $('ag-record-btn').addEventListener('click',function(){
    if(S.recording) stopRecording(); else startRecording();
  });
  $('ag-video-btn').addEventListener('click',function(){
    if(S.videoRecording) stopVideoRecording(); else startVideoRecording();
  });

  // Restore saved size
  try{
    var _sz=JSON.parse(localStorage.getItem('__ag_panel_size')||'null');
    if(_sz&&_sz.w&&_sz.h){ panel.style.width=_sz.w+'px'; panel.style.height=_sz.h+'px'; }
  }catch(e){}

  // All 8 resize handles
  ['n','s','e','w','nw','ne','sw','se'].forEach(function(edge){
    var h=document.createElement('div');
    h.className='ag-rz'; h.id='ag-rz-'+edge;
    panel.appendChild(h);
    h.addEventListener('mousedown',function(e){
      e.stopPropagation(); e.preventDefault();
      S.resizing=true; S.resizeEdge=edge;
      S.resizeStartX=e.clientX; S.resizeStartY=e.clientY;
      S.resizeStartW=panel.offsetWidth; S.resizeStartH=panel.offsetHeight;
      S.resizeStartR=parseInt(panel.style.right||'24')||24;
      S.resizeStartB=parseInt(panel.style.bottom||'76')||76;
    });
  });

  // Move mode — double-click anywhere on panel toggles move mode
  panel.addEventListener('dblclick',function(e){
    var t=e.target;
    if(t.tagName==='BUTTON'||t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='A') return;
    S.moveMode=!S.moveMode;
    panel.classList.toggle('ag-move-mode',S.moveMode);
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&S.moveMode){ S.moveMode=false; panel.classList.remove('ag-move-mode'); }
  });

  // Drag — header always drags, whole panel drags in move mode
  let dx=0,dy=0,startX=0,startY=0;
  const ph=$('ag-ph');
  function startDrag(e){
    S.dragging=true;
    startX=e.clientX; startY=e.clientY;
    dx=parseInt(panel.style.right||'24')||24;
    dy=parseInt(panel.style.bottom||'76')||76;
  }
  ph.addEventListener('mousedown',function(e){
    if(e.target.id==='ag-close') return;
    startDrag(e);
  });
  panel.addEventListener('mousedown',function(e){
    if(!S.moveMode||S.resizing) return;
    var t=e.target;
    if(t.tagName==='BUTTON'||t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.className.indexOf('ag-rz')>=0) return;
    e.preventDefault();
    startDrag(e);
  });

  document.addEventListener('mousemove',function(e){
    if(S.resizing){
      var ddx=e.clientX-S.resizeStartX; // positive = right
      var ddy=e.clientY-S.resizeStartY; // positive = down
      var minW=300,maxW=window.innerWidth*.9,minH=280,maxH=window.innerHeight*.9;
      // Width changes
      if(S.resizeEdge==='w'||S.resizeEdge==='nw'||S.resizeEdge==='sw'){
        // drag left edge left (ddx<0) = wider; right is fixed
        var nw=Math.min(maxW,Math.max(minW,S.resizeStartW-ddx));
        panel.style.width=nw+'px';
      }
      if(S.resizeEdge==='e'||S.resizeEdge==='ne'||S.resizeEdge==='se'){
        // drag right edge right (ddx>0) = wider; left is fixed → right anchor decreases
        var nw2=Math.min(maxW,Math.max(minW,S.resizeStartW+ddx));
        panel.style.width=nw2+'px';
        panel.style.right=Math.max(0,S.resizeStartR-ddx)+'px';
      }
      // Height changes
      if(S.resizeEdge==='n'||S.resizeEdge==='nw'||S.resizeEdge==='ne'){
        // drag top edge up (ddy<0) = taller; bottom is fixed
        var nh=Math.min(maxH,Math.max(minH,S.resizeStartH-ddy));
        panel.style.height=nh+'px';
      }
      if(S.resizeEdge==='s'||S.resizeEdge==='sw'||S.resizeEdge==='se'){
        // drag bottom edge down (ddy>0) = taller; top is fixed → bottom anchor decreases
        var nh2=Math.min(maxH,Math.max(minH,S.resizeStartH+ddy));
        panel.style.height=nh2+'px';
        panel.style.bottom=Math.max(0,S.resizeStartB-ddy)+'px';
      }
      return;
    }
    if(!S.dragging) return;
    const nx=dx-(e.clientX-startX);
    const ny=dy-(e.clientY-startY);
    panel.style.right=Math.max(0,nx)+'px';
    panel.style.bottom=Math.max(0,ny)+'px';
  });
  document.addEventListener('mouseup',function(){
    if(S.resizing){
      S.resizing=false; S.resizeEdge=null;
      try{ localStorage.setItem('__ag_panel_size',JSON.stringify({w:panel.offsetWidth,h:panel.offsetHeight})); }catch(e){}
    }
    S.dragging=false;
  });

  updateBadge();
}

/* ── Panel helpers ──────────────────────────────────────────────────────── */
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function ts(ms){ const d=new Date(ms); return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0'); }
function statusClass(s){ return s===0?'ag-status-0':s<300?'ag-status-ok':s<400?'ag-status-warn':'ag-status-err'; }

function togglePanel(){ S.open?closePanel():openPanel(); }
function openPanel(){
  S.open=true;
  const p=$('ag-panel');
  if(p){ p.classList.remove('ag-hidden'); }
  $('ag-ph-url').textContent=location.pathname;
  renderTab();
}
function closePanel(){
  S.open=false;
  const p=$('ag-panel');
  if(p) p.classList.add('ag-hidden');
}
function setTab(tab){
  S.tab=tab;
  $$('.ag-tab').forEach(function(t){ t.classList.toggle('ag-active',t.dataset.tab===tab); });
  renderTab();
}
function renderTab(){
  if(S.tab==='console') renderConsole();
  else if(S.tab==='network') renderNetwork();
  else if(S.tab==='inspect') renderInspect();
  else if(S.tab==='actions') renderActions();
  else if(S.tab==='ai') renderAI();
  else if(S.tab==='perf') renderPerf();
  else if(S.tab==='deps') renderDeps();
  else if(S.tab==='export') renderExport();
}

function updateBadge(){
  const badge=$('ag-badge');
  if(!badge) return;
  const errs=S.console.filter(function(e){ return e.type==='error'; }).length
             + S.network.filter(function(e){ return e.status===0||e.status>=400; }).length;
  if(errs>0){ badge.style.display='block'; badge.textContent=errs>99?'99+':String(errs); }
  else badge.style.display='none';

  // Update tab badges
  $$('.ag-tab').forEach(function(t){
    const existing=t.querySelector('.ag-tab-badge');
    if(existing) existing.remove();
    if(t.dataset.tab==='console'){
      const c=S.console.filter(function(e){ return e.type==='error'; }).length;
      if(c>0){ const b=document.createElement('span'); b.className='ag-tab-badge'; b.textContent=String(c); t.appendChild(b); }
    } else if(t.dataset.tab==='network'){
      const c=S.network.filter(function(e){ return e.status===0||e.status>=400; }).length;
      if(c>0){ const b=document.createElement('span'); b.className='ag-tab-badge'; b.textContent=String(c); t.appendChild(b); }
    }
  });
}

function renderConsole(){
  const el=$('ag-content');
  if(!el) return;
  if(!S.console.length){ el.innerHTML='<div class="ag-empty">No console events captured yet.</div>'; return; }
  el.innerHTML=S.console.slice().reverse().map(function(e){
    const pill = e.type==='error'?'ag-pill-error':e.type==='warn'?'ag-pill-warn':'ag-pill-log';
    return '<div class="ag-ev">'
      +'<div class="ag-ev-hdr"><span class="ag-pill '+pill+'">'+e.type.toUpperCase()+'</span>'
      +(e.sourceUrl?'<span style="font-size:10px;color:#c9d1d9">'+esc(e.sourceUrl.split('/').pop()||'')+(e.line?':'+e.line:'')+'</span>':'')
      +'<span class="ag-ev-time">'+ts(e.timestamp)+'</span></div>'
      +'<div class="ag-ev-msg">'+esc(e.message)+'</div>'
      +(e.stack?'<div class="ag-ev-stack">'+esc(e.stack.split('\\n').slice(1,3).join(' | '))+'</div>':'')
      +'</div>';
  }).join('');
}

function prettyBody(s){
  if(!s) return '';
  try{ return JSON.stringify(JSON.parse(s),null,2); }
  catch(e){ return s; }
}

function renderNetDetail(e){
  var html='<div class="ag-net-detail">';

  // General
  html+='<div class="ag-nd-section">'
    +'<div class="ag-nd-label">General</div>'
    +'<div class="ag-nd-kv"><span class="ag-nd-k">URL</span><span class="ag-nd-v">'+esc(e.url)+'</span></div>'
    +'<div class="ag-nd-kv"><span class="ag-nd-k">Method</span><span class="ag-nd-v">'+esc(e.method)+'</span></div>'
    +'<div class="ag-nd-kv"><span class="ag-nd-k">Status</span><span class="ag-nd-v '+(e.status>=400||e.status===0?'ag-status-err':'ag-status-ok')+'">'+e.status+(e.status>0?' '+httpText(e.status):'')+'</span></div>'
    +'<div class="ag-nd-kv"><span class="ag-nd-k">Duration</span><span class="ag-nd-v">'+e.duration+'ms</span></div>'
    +(e.requestMimeType?'<div class="ag-nd-kv"><span class="ag-nd-k">Content-Type</span><span class="ag-nd-v">'+esc(e.requestMimeType)+'</span></div>':'')
    +'</div>';

  // Request headers
  if(e.requestHeaders && Object.keys(e.requestHeaders).length){
    html+='<div class="ag-nd-section"><div class="ag-nd-label">Request Headers</div>';
    Object.keys(e.requestHeaders).forEach(function(k){
      var v=e.requestHeaders[k];
      var redacted=v==='[REDACTED]';
      html+='<div class="ag-nd-kv"><span class="ag-nd-k">'+esc(k)+'</span><span class="ag-nd-v'+(redacted?' redacted':'')+'">'+esc(v)+'</span></div>';
    });
    html+='</div>';
  }

  // Request payload
  if(e.requestBody){
    html+='<div class="ag-nd-section"><div class="ag-nd-label">Request Payload</div>'
      +'<div class="ag-nd-body">'+esc(prettyBody(e.requestBody))+'</div></div>';
  }

  // Response headers
  if(e.responseHeaders && Object.keys(e.responseHeaders).length){
    html+='<div class="ag-nd-section"><div class="ag-nd-label">Response Headers</div>';
    Object.keys(e.responseHeaders).forEach(function(k){
      var v=e.responseHeaders[k];
      html+='<div class="ag-nd-kv"><span class="ag-nd-k">'+esc(k)+'</span><span class="ag-nd-v">'+esc(v)+'</span></div>';
    });
    html+='</div>';
  }

  // Response body / error
  if(e.error){
    html+='<div class="ag-nd-section"><div class="ag-nd-label">Error</div>'
      +'<div class="ag-nd-err">'+esc(e.error)+'</div></div>';
  } else if(e.responseBody){
    var size=e.responseSize?'  ('+Math.round(e.responseSize/1024*10)/10+'KB)':'';
    html+='<div class="ag-nd-section"><div class="ag-nd-label">Response Body'+size+'</div>'
      +'<div class="ag-nd-body">'+esc(prettyBody(e.responseBody))+'</div></div>';
  }

  html+='</div>';
  return html;
}

var HTTP_TEXTS={200:'OK',201:'Created',204:'No Content',301:'Moved Permanently',302:'Found',400:'Bad Request',401:'Unauthorized',403:'Forbidden',404:'Not Found',405:'Method Not Allowed',409:'Conflict',422:'Unprocessable Entity',429:'Too Many Requests',500:'Internal Server Error',502:'Bad Gateway',503:'Service Unavailable'};
function httpText(s){ return HTTP_TEXTS[s]||''; }

function fmtSize(bytes){
  if(!bytes&&bytes!==0) return '-';
  if(bytes<1024) return bytes+'B';
  return (bytes/1024).toFixed(1)+'KB';
}

function renderNetwork(){
  const el=$('ag-content');
  if(!el) return;

  // View switcher always at top (injected before scroll container)
  var viewBar='<div class="ag-net-view-bar">'
    +'<button class="ag-net-view-btn'+(S.networkView==='list'?' active':'')+'" id="ag-nv-list">≡ List</button>'
    +'<button class="ag-net-view-btn'+(S.networkView==='waterfall'?' active':'')+'" id="ag-nv-wf">▦ Waterfall</button>'
    +'</div>';

  if(!S.network.length){
    el.innerHTML=viewBar+'<div class="ag-empty">No network requests captured yet.</div>';
    el.querySelector('#ag-nv-list').addEventListener('click',function(){ S.networkView='list'; renderNetwork(); });
    el.querySelector('#ag-nv-wf').addEventListener('click',function(){ S.networkView='waterfall'; renderNetwork(); });
    return;
  }

  if(S.networkView==='waterfall'){
    renderNetworkWaterfall(el, viewBar);
  } else {
    renderNetworkList(el, viewBar);
  }
}

function renderNetworkList(el, viewBar){
  var rows=S.network.slice().reverse().map(function(e){
    const sc=statusClass(e.status);
    const urlShort=e.url.replace(/^https?:\\/\\/[^/]+/,'').slice(0,55)||(e.url.slice(0,55));
    const key=String(e.timestamp);
    const open=!!S.networkExpanded[key];
    return '<div class="ag-net-ev" data-key="'+key+'">'
      +'<div class="ag-net-row">'
      +'<div class="ag-net-hdr">'
      +'<span class="ag-net-toggle">'+(open?'▼':'▶')+'</span>'
      +'<span class="ag-method">'+esc(e.method)+'</span>'
      +'<span class="ag-net-url" title="'+esc(e.url)+'">'+esc(urlShort)+'</span>'
      +'<span class="'+sc+'" style="font-size:11px;font-weight:600;flex-shrink:0">'+e.status+'</span></div>'
      +'<div class="ag-net-meta">'+e.duration+'ms'+(e.responseSize?' · '+fmtSize(e.responseSize):'')+(e.error?' · '+esc(e.error.slice(0,50)):'')+'</div>'
      +'</div>'
      +(open?renderNetDetail(e):'')
      +'</div>';
  }).join('');
  el.innerHTML=viewBar+rows;
  el.querySelector('#ag-nv-list').addEventListener('click',function(){ S.networkView='list'; renderNetwork(); });
  el.querySelector('#ag-nv-wf').addEventListener('click',function(){ S.networkView='waterfall'; renderNetwork(); });
  el.querySelectorAll('.ag-net-ev').forEach(function(row){
    row.addEventListener('click',function(){
      if(window.getSelection&&window.getSelection().toString()) return;
      S.networkExpanded[row.dataset.key]=!S.networkExpanded[row.dataset.key];
      renderNetworkList(el, viewBar);
    });
  });
}

function renderNetworkWaterfall(el, viewBar){
  var filter=S.harFilter||'all';
  var search=(S.harSearch||'').toLowerCase();

  // Timeline bounds (use ALL events for consistent scale even when filtering)
  var t0=Infinity, tEnd=-Infinity;
  S.network.forEach(function(e){
    var s=e.timestamp-e.duration; if(s<t0) t0=s;
    if(e.timestamp>tEnd) tEnd=e.timestamp;
  });
  var span=Math.max(1,tEnd-t0);

  var totalSize=S.network.reduce(function(a,e){ return a+(e.responseSize||0); },0);
  var failed=S.network.filter(function(e){ return e.status>=400||e.status===0; }).length;

  // Sort by start time so waterfall reads top-to-bottom chronologically
  var events=S.network.slice().sort(function(a,b){
    return (a.timestamp-a.duration)-(b.timestamp-b.duration);
  }).filter(function(e){
    if(filter==='failed'&&e.status<400&&e.status!==0) return false;
    if(search&&e.url.toLowerCase().indexOf(search)<0) return false;
    return true;
  });

  // Time axis ticks at 0%, 25%, 50%, 75%, 100%
  var ticks=[0,0.25,0.5,0.75,1].map(function(r){
    var ms=Math.round(span*r);
    return {pct:(r*100).toFixed(1), label:ms>999?(ms/1000).toFixed(2)+'s':ms+'ms'};
  });

  var html=viewBar
    // Summary
    +'<div class="ag-wf-summary">'
    +'<span class="ag-wf-stat">'+S.network.length+' req</span>'
    +(failed?'<span class="ag-wf-stat ag-wf-stat-err">'+failed+' failed</span>':'')
    +(totalSize?'<span class="ag-wf-stat">'+fmtSize(totalSize)+'</span>':'')
    +'<span class="ag-wf-stat">'+(span>999?(span/1000).toFixed(2)+'s':span+'ms')+'</span>'
    +'<button class="ag-btn" id="ag-wf-dl" style="font-size:9px;padding:2px 8px;margin-left:auto">⬇ HAR</button>'
    +'</div>'
    // Filters
    +'<div class="ag-wf-filters">'
    +'<button class="ag-wf-flt'+(filter==='all'?' active':'')+'" data-f="all">All</button>'
    +'<button class="ag-wf-flt'+(filter==='failed'?' active':'')+'" data-f="failed">Failed</button>'
    +'<input class="ag-wf-search" id="ag-wf-search" placeholder="Filter URL…" value="'+esc(S.harSearch||'')+'">'
    +'</div>'
    // Column header
    +'<div style="display:flex;border-bottom:1px solid #21262d;background:#161b22;flex-shrink:0;user-select:none">'
    +'<div class="ag-wf-hdr-meta" style="font-size:9px;font-weight:700;color:#c9d1d9;text-transform:uppercase;letter-spacing:.4px;gap:0">'
    +'<span class="ag-wf-hst">St</span><span class="ag-wf-hmt">Method</span><span class="ag-wf-hpath">Path</span><span class="ag-wf-hsz">Size</span>'
    +'</div>'
    +'<div class="ag-wf-hdr-tl">Timeline</div>'
    +'</div>'
    // Time axis ruler
    +'<div class="ag-wf-axis">'
    +'<div class="ag-wf-axis-left">'+ticks[ticks.length-1].label+'</div>'
    +'<div class="ag-wf-axis-right">'
    +ticks.map(function(t){
      return '<span class="ag-wf-axis-tick" style="left:'+t.pct+'%">'+t.label+'</span>';
    }).join('')
    +'</div>'
    +'</div>';

  if(!events.length){
    html+='<div class="ag-empty">No requests match the filter.</div>';
  } else {
    events.forEach(function(e){
      var key=String(e.timestamp);
      var open=!!S.networkExpanded[key];
      var sc=statusClass(e.status);
      var path=e.url.replace(/^https?:\\/\\/[^/]+/,'');
      if(!path) path=e.url.slice(0,40);
      var barLeft=((e.timestamp-e.duration-t0)/span*100).toFixed(2);
      var barW=Math.max(0.4,(e.duration/span*100)).toFixed(2);
      var barCls=e.status===0?'wf-0':e.status>=500?'wf-5xx':e.status>=400?'wf-4xx':e.status>=300?'wf-3xx':'wf-2xx';
      var durLabel=e.duration>0?e.duration+'ms':'';

      html+='<div class="ag-wf-row'+(open?' row-open':'')+'" data-key="'+key+'">'
        // Left: metadata
        +'<div class="ag-wf-meta">'
        +'<span class="ag-wf-hst '+sc+'" style="font-weight:700;font-size:10px">'+e.status+'</span>'
        +'<span class="ag-wf-hmt"><span class="ag-method">'+esc(e.method)+'</span></span>'
        +'<span class="ag-wf-hpath" title="'+esc(e.url)+'">'+esc(path)+'</span>'
        +'<span class="ag-wf-hsz">'+fmtSize(e.responseSize||(e.responseBody?e.responseBody.length:0))+'</span>'
        +'</div>'
        // Right: timeline with grid lines + bar
        +'<div class="ag-wf-tl">'
        +'<div class="ag-wf-tl-inner">'
        // Grid lines at 25%, 50%, 75%
        +'<div class="ag-wf-gridline" style="left:25%"></div>'
        +'<div class="ag-wf-gridline" style="left:50%"></div>'
        +'<div class="ag-wf-gridline" style="left:75%"></div>'
        // The bar
        +'<div class="ag-wf-bar '+barCls+'" style="left:'+barLeft+'%;width:'+barW+'%" title="start:'+Math.round(e.timestamp-e.duration-t0)+'ms  duration:'+e.duration+'ms"></div>'
        // Duration label — shown after bar if there's space, else overlaid
        +(parseFloat(barW)<20?'<div class="ag-wf-bar-lbl '+barCls+'" style="left:calc('+barLeft+'% + '+barW+'% + 3px)">'+durLabel+'</div>':'')
        +'</div>'
        +'</div>'
        +'</div>'
        +(open?'<div class="ag-wf-detail-wrap">'+renderNetDetail(e)+'</div>':'');
    });
  }

  el.innerHTML=html;

  el.querySelector('#ag-nv-list').addEventListener('click',function(){ S.networkView='list'; renderNetwork(); });
  el.querySelector('#ag-nv-wf').addEventListener('click',function(){ S.networkView='waterfall'; renderNetwork(); });
  el.querySelector('#ag-wf-dl').addEventListener('click',function(){ window.open(AG_BASE+'/har','_blank'); });
  el.querySelectorAll('.ag-wf-flt').forEach(function(b){
    b.addEventListener('click',function(){ S.harFilter=b.dataset.f; renderNetworkWaterfall(el,viewBar); });
  });
  var srch=el.querySelector('#ag-wf-search');
  if(srch) srch.addEventListener('input',function(){ S.harSearch=srch.value; renderNetworkWaterfall(el,viewBar); });
  el.querySelectorAll('.ag-wf-row').forEach(function(row){
    row.addEventListener('click',function(){
      if(window.getSelection&&window.getSelection().toString()) return;
      S.networkExpanded[row.dataset.key]=!S.networkExpanded[row.dataset.key];
      renderNetworkWaterfall(el,viewBar);
    });
  });
}

function renderInspect(){
  const el=$('ag-content');
  if(!el) return;
  const info=S.lastElement;
  if(!info){
    el.innerHTML='<div class="ag-empty">Click the 🔍 button then click any element in your app to inspect it.</div>';
    return;
  }
  var tag=(info.tag||'?')+(info.id?'#'+info.id:'')+(info.className?' .'+info.className.split(' ')[0]:'');
  var rows='';
  if(info.componentName) rows+='<div class="ag-inspect-row"><span class="ag-inspect-key">Component</span><span class="ag-inspect-val">'+esc(info.componentName)+'</span></div>';
  if(info.sourceFile) rows+='<div class="ag-inspect-row"><span class="ag-inspect-key">Source</span><span class="ag-inspect-val">'+esc(info.sourceFile.split('/').slice(-3).join('/'))+(info.sourceLine?':'+info.sourceLine:'')+'</span></div>';
  if(info.text) rows+='<div class="ag-inspect-row"><span class="ag-inspect-key">Text</span><span class="ag-inspect-val">'+esc(info.text.slice(0,80))+'</span></div>';
  rows+='<div class="ag-inspect-row"><span class="ag-inspect-key">Position</span><span class="ag-inspect-val">'+info.rect.x+', '+info.rect.y+' ('+info.rect.width+'×'+info.rect.height+')</span></div>';
  if(info.ancestorPath&&info.ancestorPath.length){
    rows+='<div class="ag-inspect-row"><span class="ag-inspect-key">In</span><span class="ag-inspect-val">'+esc(info.ancestorPath.join(' › '))+'</span></div>';
  }
  var chain='';
  if(info.componentChain&&info.componentChain.length>1){
    chain='<div class="ag-inspect-chain">'+info.componentChain.map(function(c){ return '<span class="ag-chain-pill">'+esc(c)+'</span>'; }).join('')+'</div>';
  }
  el.innerHTML='<div class="ag-inspect-info"><div class="ag-inspect-el">'+esc(tag)+'</div>'+rows+chain+'</div>';
}

function renderActions(){
  const el=$('ag-content');
  if(!el) return;
  var btnLabel=S.recording?'⏹ Stop':'⏺ Record';
  var btnCls=S.recording?'ag-btn-primary':'';
  if(!S.actions.length){
    el.innerHTML='<div style="padding:10px 14px 0"><button class="ag-btn '+btnCls+'" id="ag-rec-toggle">'+btnLabel+'</button></div>'
      +'<div class="ag-empty" style="padding:24px 16px">Click Record to capture clicks, inputs and navigations.</div>';
    el.querySelector('#ag-rec-toggle').addEventListener('click',function(){ S.recording?stopRecording():startRecording(); renderActions(); });
    return;
  }
  var rows=S.actions.map(function(a){
    var cls='ag-action-'+(a.type==='navigation'?'nav':a.type==='click'?'click':a.type==='input'||a.type==='submit'?'input':'submit');
    var label=a.type==='navigation'?(a.url||'').replace(/^https?:\\/\\/[^/]+/,'').slice(0,40)||'/'
             :a.type==='click'?('Click: '+(a.value||a.target||''))
             :a.type==='input'?('Input '+(a.target||'')+': '+(a.value||''))
             :(a.type+': '+(a.target||''));
    var d=new Date(a.timestamp);
    var t=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
    return '<div class="ag-action-row"><span class="ag-action-type '+cls+'">'+a.type+'</span><span class="ag-action-val">'+esc(label.slice(0,60))+'</span><span class="ag-action-time">'+t+'</span></div>';
  }).join('');
  el.innerHTML='<div style="padding:8px 14px 6px;display:flex;gap:6px"><button class="ag-btn '+btnCls+'" id="ag-rec-toggle" style="font-size:11px">'+btnLabel+'</button>'
    +'<button class="ag-btn" id="ag-rec-clear" style="font-size:11px">Clear</button></div>'+rows;
  el.querySelector('#ag-rec-toggle').addEventListener('click',function(){ S.recording?stopRecording():startRecording(); renderActions(); });
  el.querySelector('#ag-rec-clear').addEventListener('click',function(){ S.actions=[]; stopRecording(); renderActions(); });
}

/* ── Screen recording & export ──────────────────────────────────────────── */
function triggerDownload(url, filename){
  var a=document.createElement('a');
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); },1000);
}

function updateVideoUI(){
  var btn=$('ag-video-btn');
  var timer=$('ag-vid-timer');
  var elapsed=$('ag-vid-elapsed');
  if(btn){
    btn.style.color=S.videoRecording?'#f85149':'';
    btn.style.borderColor=S.videoRecording?'rgba(248,81,73,.5)':'';
    btn.title=S.videoRecording?'Stop recording':'Screen recording (HAR + video)';
  }
  if(timer) timer.style.display=S.videoRecording?'flex':'none';
  if(elapsed&&S.videoRecording){
    var sec=Math.floor((Date.now()-S.videoStart)/1000);
    elapsed.textContent=Math.floor(sec/60)+':'+(sec%60).toString().padStart(2,'0');
  }
}

function startVideoRecording(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia){
    alert('Screen recording is not supported in this browser.');
    return;
  }
  navigator.mediaDevices.getDisplayMedia({video:true,audio:false}).then(function(stream){
    S.videoChunks=[];
    S.videoStart=Date.now();
    S.videoRecording=true;
    S.videoElapsed=0;
    S.videoBlob=null;
    if(!S.recording) startRecording();

    var mimeType='video/webm;codecs=vp8';
    if(!MediaRecorder.isTypeSupported(mimeType)) mimeType='video/webm';
    var recorder=new MediaRecorder(stream,{mimeType:mimeType});
    S.videoRecorder=recorder;

    recorder.ondataavailable=function(e){ if(e.data&&e.data.size>0) S.videoChunks.push(e.data); };
    recorder.onstop=function(){
      S.videoBlob=new Blob(S.videoChunks,{type:'video/webm'});
      S.videoRecording=false;
      S.videoRecorder=null;
      if(S.videoTimer){ clearInterval(S.videoTimer); S.videoTimer=null; }
      stream.getTracks().forEach(function(t){ t.stop(); });
      // Upload recording + HAR to server
      fetch(AG_BASE+'/recording',{method:'POST',body:S.videoBlob,headers:{'Content-Type':'video/webm'}}).catch(function(){});
      updateVideoUI();
      if(S.open&&S.tab==='export') renderExport();
    };
    recorder.start(1000);

    S.videoTimer=setInterval(function(){ updateVideoUI(); },1000);
    stream.getVideoTracks()[0].onended=function(){ if(S.videoRecording) stopVideoRecording(); };
    updateVideoUI();
  }).catch(function(err){
    if(err.name!=='NotAllowedError') alert('Could not start screen recording: '+err.message);
  });
}

function stopVideoRecording(){
  if(S.videoRecorder&&S.videoRecorder.state!=='inactive'){
    S.videoRecorder.stop();
  } else {
    S.videoRecording=false;
    if(S.videoTimer){ clearInterval(S.videoTimer); S.videoTimer=null; }
    updateVideoUI();
  }
}

function renderExport(){
  const el=$('ag-content');
  if(!el) return;
  var netCount=S.network.length;
  var errCount=S.console.filter(function(e){ return e.type==='error'; }).length;
  var hasVideo=!!S.videoBlob;
  var tg=S.testGen;

  // Test gen output block
  var tgOutputHtml='';
  var hasLogs=tg.logs && tg.logs.length>0;
  var termHtml=hasLogs?'<div class="ag-tg-terminal" id="ag-tg-terminal">'+tg.logs.map(function(l){
    var cls=l.startsWith('✓')?'tg-ok':l.startsWith('✗')?'tg-err':'tg-log';
    return '<span class="'+cls+'">'+esc(l)+'</span>';
  }).join('\\n')+'</div>':'';

  if(tg.status==='generating'){
    tgOutputHtml=termHtml
      +'<div class="ag-tg-code" id="ag-tg-live">'+(tg.output||'')+'<span class="ag-tg-blink"></span></div>';
  } else if(tg.status==='done' && tg.output){
    tgOutputHtml=termHtml
      +'<div class="ag-tg-code'+(hasLogs?'':' ag-tg-code-only')+'" id="ag-tg-code">'+esc(tg.output)+'</div>'
      +'<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
      +'<button class="ag-btn" id="ag-tg-copy" style="font-size:10px;padding:3px 10px">📋 Copy</button>'
      +(tg.filePath?'<div class="ag-tg-footer">✓ Saved → '+esc(tg.filePath)+'</div>':'')
      +'</div>';
      // TODO Stage 2: auto-run before/after verification loop
      // Run test → should PASS. git stash → run test → should FAIL. git stash pop.
      // Confirm: "✅ Real regression test — fails without fix, passes with fix"
  } else if(tg.status==='done' && !tg.output){
    tgOutputHtml=termHtml
      +'<div class="ag-tg-err-box">No test code generated — see process log above.</div>'
      +'<button class="ag-btn" id="ag-tg-gen-retry" style="text-align:left;margin-top:4px">🔁 Retry</button>';
  } else if(tg.status==='error'){
    tgOutputHtml='<div class="ag-tg-err-box">'+esc(tg.output||'Spawn failed — is claude installed?')+'</div>'
      +'<button class="ag-btn" id="ag-tg-gen-retry" style="text-align:left;margin-top:4px">🔁 Retry</button>';
  }

  el.innerHTML='<div style="padding:14px;display:flex;flex-direction:column;gap:10px">'
    +'<div style="font-size:10px;font-weight:700;color:#e6edf3;text-transform:uppercase;letter-spacing:.5px">Bug Report Export</div>'
    +(S.videoRecording?'<div style="font-size:11px;color:#f85149;font-weight:600">⏺ Recording… click 🎥 to stop</div>':'')
    +'<div style="font-size:11px;color:#c9d1d9">'+netCount+' requests · '+errCount+' errors · '+S.actions.length+' actions</div>'
    +'<div style="display:flex;flex-direction:column;gap:7px">'
    +'<button class="ag-btn" id="ag-dl-har" style="text-align:left">📋  Download HAR ('+netCount+' requests)</button>'
    +(hasVideo
      ?'<button class="ag-btn" id="ag-dl-video" style="text-align:left">🎬  Download Video (.webm)</button>'
        +'<button class="ag-btn ag-btn-primary" id="ag-dl-both" style="text-align:left">📦  Download HAR + Video</button>'
      :'<div style="font-size:11px;color:#c9d1d9;padding:4px 0">No recording yet — click 🎥 in the toolbar to capture screen.</div>'
    )
    +'</div>'
    +'<div style="font-size:10px;color:#c9d1d9;border-top:1px solid #21262d;padding-top:8px">HAR is compatible with Chrome DevTools · Postman · Insomnia</div>'
    // ── Regression Test Generator ──
    +'<div class="ag-tg-section">'
    +'<div class="ag-tg-title">🧪 Regression Test'+(tg.framework?'<span class="ag-tg-fw">'+esc(tg.framework)+'</span>':'')+'</div>'
    +'<div style="font-size:10px;color:#c9d1d9">Generate a test that reproduces this exact bug — fails before the fix, passes after.</div>'
    +'<button class="ag-btn ag-btn-primary" id="ag-tg-gen" style="text-align:left"'+(tg.status==='generating'?' disabled':'')+'>'+( tg.status==='generating'?'⏳ Generating…':'🧪 Generate Regression Test')+'</button>'
    +tgOutputHtml
    +'</div>'
    +'</div>';

  // HAR
  var harBtn=$('ag-dl-har');
  if(harBtn) harBtn.addEventListener('click',function(){ window.open(AG_BASE+'/har','_blank'); });

  // Video
  if(hasVideo){
    var videoBtn=$('ag-dl-video');
    if(videoBtn) videoBtn.addEventListener('click',function(){
      triggerDownload(URL.createObjectURL(S.videoBlob),'arcguard-recording.webm');
    });
    var bothBtn=$('ag-dl-both');
    if(bothBtn) bothBtn.addEventListener('click',function(){
      triggerDownload(URL.createObjectURL(S.videoBlob),'arcguard-recording.webm');
      setTimeout(function(){ window.open(AG_BASE+'/har','_blank'); },400);
    });
  }

  // Test generator
  var genBtn=$('ag-tg-gen');
  if(genBtn) genBtn.addEventListener('click', generateRegressionTest);

  var copyBtn=$('ag-tg-copy');
  if(copyBtn) copyBtn.addEventListener('click',function(){
    navigator.clipboard.writeText(S.testGen.output).catch(function(){});
    copyBtn.textContent='✓ Copied';
    setTimeout(function(){ if(copyBtn) copyBtn.textContent='📋 Copy'; },1500);
  });

  wireTestGenRetry();
}

function generateRegressionTest(){
  if(S.testGen.status==='generating') return;
  S.testGen={ status:'generating', output:'', framework:'', filePath:'', lastErr:'', logs:[] };
  renderExport();

  var context=buildContextPrompt('');
  fetch(AG_BASE+'/generate-test',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({context:context})
  }).then(function(resp){
    if(!resp.body){ throw new Error('No response body'); }
    var reader=resp.body.getReader();
    var decoder=new TextDecoder();
    var buf='';
    var finished=false;

    function appendLog(line){
      S.testGen.logs.push(line);
      // targeted DOM update — append to terminal without re-render
      var term=$('ag-tg-terminal');
      if(!term){ renderExport(); return; }
      var cls=line.startsWith('✓')?'tg-ok':line.startsWith('✗')?'tg-err':'tg-log';
      if(term.childNodes.length) term.appendChild(document.createTextNode('\\n'));
      var span=document.createElement('span');
      span.className=cls;
      span.textContent=line;
      term.appendChild(span);
      term.scrollTop=term.scrollHeight;
    }

    function appendCode(chunk){
      S.testGen.output+=chunk;
      var liveEl=$('ag-tg-live');
      if(!liveEl){ renderExport(); return; }
      // update just the text before the blink cursor span
      var blink=liveEl.querySelector('.ag-tg-blink');
      if(blink){
        var tn=document.createTextNode(chunk);
        liveEl.insertBefore(tn,blink);
      } else {
        liveEl.textContent+=chunk;
      }
      liveEl.scrollTop=liveEl.scrollHeight;
    }

    function pump(){
      reader.read().then(function(d){
        if(d.done){ if(!finished){ finished=true; finishTest(); } return; }
        buf+=decoder.decode(d.value,{stream:true});
        var lines=buf.split('\\n');
        buf=lines.pop()||'';
        lines.forEach(function(line){
          if(!line.startsWith('data:')) return;
          var raw=line.slice(5).trim();
          if(!raw) return;
          try{
            var msg=JSON.parse(raw);
            if(!msg || typeof msg!=='object') return;
            if(msg.type==='log'){   appendLog(msg.value||''); }
            else if(msg.type==='token'){ appendCode(msg.value||''); }
            else if(msg.type==='framework'){ S.testGen.framework=msg.value||''; }
            else if(msg.type==='filepath'){  S.testGen.filePath=msg.value||''; }
            else if(msg.type==='done'){ if(!finished){ finished=true; finishTest(); } }
          }catch(e){}
        });
        if(!finished) pump();
      }).catch(function(){ if(!finished){ finished=true; finishTest(); } });
    }
    pump();
  }).catch(function(err){
    S.testGen.status='error';
    S.testGen.output='Cannot reach arcguard server: '+String(err)+'. Is \`arcguard dev\` running?';
    renderExport();
  });

  function finishTest(){
    S.testGen.status='done';
    renderExport();
  }
}

function wireTestGenRetry(){
  var retryBtn=$('ag-tg-gen-retry');
  if(retryBtn) retryBtn.addEventListener('click',function(){
    S.testGen={status:'idle',output:'',framework:'',filePath:'',lastErr:'',logs:[]};
    generateRegressionTest();
  });
}

function buildContextPrompt(question){
  const errors=S.console.filter(function(e){ return e.type==='error'||e.type==='warn'; }).slice(-5);
  const nets=S.network.filter(function(e){ return e.status>=400||e.status===0; }).slice(-5);
  const lines=['## ArchGuard Bug Context','','**Page:** '+location.href,'**Time:** '+new Date().toISOString(),''];
  if(question) { lines.push('**Question:** '+question,''); }
  if(S.ctx.element && S.lastElement){
    var el=S.lastElement;
    lines.push('### Inspected Element');
    lines.push('Element: '+(el.tag||'?')+(el.id?'#'+el.id:'')+(el.className?' .'+el.className.split(' ')[0]:''));
    if(el.componentName) lines.push('Component: '+el.componentName+(el.componentChain&&el.componentChain.length>1?' (chain: '+el.componentChain.join(' > '):'')+')');
    if(el.sourceFile) lines.push('Source: '+el.sourceFile+(el.sourceLine?':'+el.sourceLine:''));
    if(el.text) lines.push('Text: '+el.text.slice(0,100));
    lines.push('');
  }
  if(S.ctx.actions && S.actions.length){
    lines.push('### User Action Timeline');
    S.actions.slice(-10).forEach(function(a){
      var d=new Date(a.timestamp);
      var t=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
      lines.push(t+' '+a.type+(a.url?' → '+a.url:a.target?' → '+a.target:'')+(a.value?' = '+a.value.slice(0,40):''));
    });
    lines.push('');
  }
  if(S.ctx.console && errors.length){
    lines.push('### Console Errors & Warnings');
    errors.forEach(function(e){ lines.push('- ['+e.type.toUpperCase()+'] '+e.message+(e.stack?'\\n  Stack: '+e.stack.split('\\n')[1]:'')+''); });
    lines.push('');
  }
  if(S.ctx.network && nets.length){
    lines.push('### Failed Network Requests');
    nets.forEach(function(e){ lines.push('- '+e.method+' '+e.url+' → '+e.status+(e.responseBody?' | '+e.responseBody.slice(0,200):'')); });
    lines.push('');
  }
  if(S.ctx.har && S.network.length){
    lines.push('### Full Network Log — HAR ('+S.network.length+' requests)');
    S.network.forEach(function(e){
      lines.push(e.method+' '+e.url+' → '+e.status+' ('+e.duration+'ms)'+(e.error?' ERR:'+e.error:''));
      if(e.requestBody) lines.push('  req: '+e.requestBody.slice(0,300));
      if(e.responseBody&&(e.status>=400||e.status===0)) lines.push('  res: '+e.responseBody.slice(0,400));
      else if(e.responseBody) lines.push('  res: '+e.responseBody.slice(0,150));
    });
    lines.push('');
  }
  if(S.ctx.git && S.gitCache){
    lines.push('### Recent Git Changes');
    if(S.gitCache.branch) lines.push('Branch: '+S.gitCache.branch);
    if(S.gitCache.log) lines.push(S.gitCache.log.split('\\n').slice(0,5).join('\\n'));
    lines.push('');
  }
  if(PROJECT) lines.push('Project: '+PROJECT);
  return lines.join('\\n');
}

// Fetch git info once per session
function fetchGit(){
  if(S.gitFetched) return;
  S.gitFetched=true;
  fetch(AG_BASE+'/git').then(function(r){ return r.json(); }).then(function(d){ S.gitCache=d; }).catch(function(){});
}
fetchGit();

/* ── AI Chat state ──────────────────────────────────────────────────────── */
var AI = { messages: [], streaming: false };

function renderContextBar(){
  const bar=$('ag-ctx-bar');
  if(!bar) return;
  var errCount=S.console.filter(function(e){return e.type==='error';}).length;
  var warnCount=S.console.filter(function(e){return e.type==='warn';}).length;
  var netFail=S.network.filter(function(e){return e.status===0||e.status>=400;}).length;

  var toggles=[
    {key:'console', label:'Console'+(errCount||warnCount?' ('+(errCount+warnCount)+')':''), col:'t-err', hasData:errCount>0||warnCount>0},
    {key:'network', label:'Net fails'+(netFail?' ('+netFail+')':''), col:'t-err', hasData:netFail>0},
    {key:'actions', label:'Actions'+(S.actions.length?' ('+S.actions.length+')':''), col:'t-act', hasData:S.actions.length>0},
    {key:'element', label:'Element'+(S.lastElement?' ('+esc(S.lastElement.componentName||S.lastElement.tag)+')':''), col:'t-el', hasData:!!S.lastElement},
    {key:'git', label:'Git'+(S.gitCache&&S.gitCache.branch?' ('+S.gitCache.branch+')':''), col:'t-git', hasData:!!(S.gitCache&&S.gitCache.branch)},
    {key:'har', label:'HAR'+(S.network.length?' ('+S.network.length+')':''), col:'t-har', hasData:S.network.length>0},
  ];

  bar.innerHTML=toggles.map(function(t){
    var on=S.ctx[t.key];
    var cls='ctx-toggle'+(on?' active '+t.col:'');
    return '<button class="'+cls+'" data-key="'+t.key+'">'+(on?'✓ ':'')+t.label+'</button>';
  }).join('');

  bar.querySelectorAll('.ctx-toggle').forEach(function(btn){
    btn.addEventListener('click',function(){ S.ctx[btn.dataset.key]=!S.ctx[btn.dataset.key]; renderContextBar(); });
  });
}

/* ── Multi-route tracking ───────────────────────────────────────────────── */
function perfScore(lcp, cls, longTaskCount, apiErrors){
  var s=100;
  if(lcp===null||lcp===0) s-=0;
  else if(lcp>4000) s-=40;
  else if(lcp>2500) s-=20;
  if(cls>0.25) s-=20; else if(cls>0.1) s-=10;
  s-=Math.min(20, longTaskCount*5);
  s-=Math.min(20, apiErrors*10);
  return Math.max(0,Math.round(s));
}

function captureRouteMetrics(path, routeStart){
  var d=getPerfData();
  var routeReqs=routeStart
    ? S.network.filter(function(r){ return !r.url.includes('/__arcguard') && r.timestamp>=routeStart; })
    : S.network.filter(function(r){ return !r.url.includes('/__arcguard'); });
  var apiErrors=routeReqs.filter(function(r){ return r.status===0||r.status>=400; }).length;
  var ltCount=d.longTasks.length;
  var snap={
    path:path,
    capturedAt:Date.now(),
    loadType:routeStart?'spa':'full',
    lcp:d.lcp, cls:d.cls, fcp:d.fcp,
    ttfb:d.navTiming?d.navTiming.ttfb:null,
    load:d.navTiming&&!routeStart?d.navTiming.load:null,
    apiCalls:routeReqs.length,
    apiErrors:apiErrors,
    longTasks:ltCount,
    score:perfScore(d.lcp,d.cls,ltCount,apiErrors)
  };
  S.routes[path]=snap;
  send('/perf/route',snap);
  return snap;
}

function onRouteChange(prev, next){
  if(prev===next) return;
  captureRouteMetrics(prev, prev===location.pathname?null:_routeStart);
  _routePath=next;
  _routeStart=Date.now();
  // Snapshot new route after it renders
  var expectedPath=next;
  setTimeout(function(){
    if(location.pathname===expectedPath){
      captureRouteMetrics(expectedPath, _routeStart);
      if(S.open&&S.tab==='perf') renderPerf();
    }
  }, 2500);
}

function initRouteTracking(){
  // Snapshot initial route after load
  window.addEventListener('load',function(){
    setTimeout(function(){
      captureRouteMetrics(_routePath, null);
      if(S.open&&S.tab==='perf') renderPerf();
    }, 2500);
  });

  // SPA navigation via pushState
  var _origPush=history.pushState.bind(history);
  history.pushState=function(state,title,url){
    var prev=location.pathname;
    _origPush(state,title,url);
    onRouteChange(prev,location.pathname);
  };
  window.addEventListener('popstate',function(){
    onRouteChange(_routePath,location.pathname);
  });
}

function analyzeRoutesWithClaude(){
  if(S.audit.status==='running') return;
  var routes=Object.keys(S.routes);
  if(!routes.length){ S.audit={status:'error',progress:'',error:'Navigate to some routes first — each visit is auto-profiled.'}; renderPerf(); return; }
  S.audit={status:'running',progress:'Asking Claude to analyze all routes…',error:''};
  renderPerf();

  var routeLines=routes.sort().map(function(path){
    var r=S.routes[path];
    return '  '+path+' — score:'+r.score+' lcp:'+(r.lcp?Math.round(r.lcp)+'ms':'?')+
      ' cls:'+(r.cls!==null?r.cls.toFixed(2):'?')+
      ' apiCalls:'+r.apiCalls+' apiErrors:'+r.apiErrors+' longTasks:'+r.longTasks+
      (r.loadType==='spa'?' [SPA nav]':' [full load]');
  }).join('\\n');

  var consoleErrors=S.console.filter(function(e){ return e.type==='error'; }).slice(-5);
  var netErrors=S.network.filter(function(r){ return r.status===0||r.status>=400; }).slice(-5);

  var question='Analyze the performance of this app across all visited routes and explain what needs to be fixed. '
    +'Focus on which routes are slowest, identify patterns (e.g. too many sequential API calls, large LCP), '
    +'and give specific actionable recommendations.';

  var context='## Performance Report — All Visited Routes\\n'
    +'Site: '+location.origin+'\\n'
    +'Collected: real browser session (not synthetic)\\n\\n'
    +'### Routes\\n'+routeLines
    +(consoleErrors.length?'\\n\\n### Recent Console Errors\\n'+consoleErrors.map(function(e){ return '- '+e.message.slice(0,120); }).join('\\n'):'')
    +(netErrors.length?'\\n\\n### Recent Network Errors\\n'+netErrors.map(function(e){ return '- '+e.method+' '+e.url+' → '+e.status; }).join('\\n'):'');

  fetch(AG_BASE+'/ask',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({question:question,context:context})
  }).then(function(resp){
    if(!resp.body){ throw new Error('No stream'); }
    var reader=resp.body.getReader();
    var decoder=new TextDecoder();
    var buf=''; var analysis='';

    function pump(){
      reader.read().then(function(d){
        if(d.done){
          S.audit.status='done';
          S.audit.progress=analysis;
          AI.messages.push({role:'user',content:question+' (from Perf tab)'});
          AI.messages.push({role:'claude',content:analysis});
          renderPerf();
          return;
        }
        buf+=decoder.decode(d.value,{stream:true});
        var lines=buf.split('\\n'); buf=lines.pop()||'';
        lines.forEach(function(line){
          if(!line.startsWith('data:')) return;
          try{
            var payload=JSON.parse(line.slice(5).trim());
            if(typeof payload==='string'){ analysis+=payload; S.audit.progress=analysis.slice(-200); renderPerf(); }
          }catch(e){}
          if(line.startsWith('event: done')){ S.audit.status='done'; renderPerf(); }
        });
        if(S.audit.status==='running') pump();
      }).catch(function(e){ S.audit.status='error'; S.audit.error=String(e); renderPerf(); });
    }
    pump();
  }).catch(function(err){ S.audit.status='error'; S.audit.error='Cannot reach server: '+String(err); renderPerf(); });
}

function renderPerf(){
  var el=$('ag-content');
  if(!el) return;

  var d=getPerfData();

  function vCls(val,good,needs){ return val===null||val===undefined?'ag-perf-na':val<=good?'ag-perf-good':val<=needs?'ag-perf-needs':'ag-perf-poor'; }
  function fmtMs(v){ return v===null||v===undefined?'—':v<1000?v+'ms':(v/1000).toFixed(2)+'s'; }
  function fmtSz(b){ return b>1048576?(b/1048576).toFixed(1)+' MB':b>1024?Math.round(b/1024)+' KB':b+' B'; }
  function scoreCls(s){ return s>=90?'ag-rt-good':s>=50?'ag-rt-needs':'ag-rt-poor'; }

  var html='<div style="padding:12px 14px;display:flex;flex-direction:column;gap:10px">';

  // Header
  html+='<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:10px;font-weight:700;color:#e6edf3;text-transform:uppercase;letter-spacing:.5px">Performance Diagnostics</div>'
    +'<button class="ag-btn ag-btn-primary" id="ag-perf-send" style="font-size:10px;padding:3px 10px">📤 Send to Claude</button>'
    +'</div>';

  // ── All Routes table ──────────────────────────────────────────────────────
  var routeKeys=Object.keys(S.routes);
  html+='<div class="ag-perf-section">'
    +'<div class="ag-perf-title">Routes <span class="ag-perf-count">'+(routeKeys.length||0)+' visited</span></div>';

  if(!routeKeys.length){
    html+='<div style="font-size:10px;color:#c9d1d9">Navigate around your app — each route is automatically profiled.</div>';
  } else {
    html+='<table class="ag-rt-table"><thead><tr>'
      +'<th class="ag-rt-th">Route</th>'
      +'<th class="ag-rt-th">Score</th>'
      +'<th class="ag-rt-th">LCP</th>'
      +'<th class="ag-rt-th">CLS</th>'
      +'<th class="ag-rt-th">API</th>'
      +'<th class="ag-rt-th">Err</th>'
      +'<th class="ag-rt-th">LT</th>'
      +'</tr></thead><tbody>';
    routeKeys.sort().forEach(function(path){
      var r=S.routes[path];
      var sc=scoreCls(r.score);
      var lcpCls=r.lcp?vCls(r.lcp,2500,4000):'';
      html+='<tr>'
        +'<td class="ag-rt-td ag-rt-path" title="'+esc(path)+'">'+esc(path)+'</td>'
        +'<td class="ag-rt-td"><span class="ag-rt-score ag-rt-'+sc+'">'+r.score+'</span></td>'
        +'<td class="ag-rt-td '+lcpCls+'" style="white-space:nowrap">'+fmtMs(r.lcp)+(r.lighthouseLcp?'<span style="font-size:8px;color:#c9d1d9"> LH</span>':'')+'</td>'
        +'<td class="ag-rt-td '+(r.cls!==null?vCls(r.cls*1000,100,250):'')+'">'+( r.cls!==null?r.cls.toFixed(2):'—')+'</td>'
        +'<td class="ag-rt-td">'+r.apiCalls+'</td>'
        +'<td class="ag-rt-td '+(r.apiErrors?'ag-rt-poor':'')+'">'+( r.apiErrors||'—')+'</td>'
        +'<td class="ag-rt-td '+(r.longTasks>2?'ag-rt-needs':'')+'">'+r.longTasks+'</td>'
        +'</tr>';
    });
    html+='</tbody></table>';

    // Analyze row
    html+='<div class="ag-rt-audit">';
    if(S.audit.status==='running'){
      html+='<span style="color:#0badbc;font-size:9px">⏳ Claude is analyzing… (see AI Chat tab when done)</span>';
    } else if(S.audit.status==='done'){
      html+='<span style="color:#3fb950;font-size:9px">✓ Analysis in AI Chat tab</span>'
        +'<button class="ag-btn" id="ag-perf-audit" style="font-size:9px;padding:2px 8px;margin-left:auto">Re-analyze</button>';
    } else if(S.audit.status==='error'){
      html+='<span class="ag-perf-err" style="font-size:9px">'+esc(S.audit.error)+'</span>'
        +'<button class="ag-btn" id="ag-perf-audit" style="font-size:9px;padding:2px 8px;margin-left:auto">Retry</button>';
    } else {
      html+='<span style="font-size:9px;color:#c9d1d9">Scores based on real browser session — not synthetic.</span>'
        +'<button class="ag-btn ag-btn-primary" id="ag-perf-audit" style="font-size:9px;padding:2px 8px;margin-left:auto">Ask Claude</button>';
    }
    html+='</div>';
  }
  html+='</div>';

  // ── Current Route ─────────────────────────────────────────────────────────
  html+='<div style="font-size:9px;font-weight:700;color:#c9d1d9;text-transform:uppercase;letter-spacing:.5px;border-top:1px solid #21262d;padding-top:8px">'
    +'Current: '+esc(location.pathname)+'</div>';

  // Web Vitals
  html+='<div class="ag-perf-section">'
    +'<div class="ag-perf-title">Web Vitals</div>'
    +'<div class="ag-perf-vitals">'
    +'<div class="ag-perf-vital '+vCls(d.lcp,2500,4000)+'"><div class="ag-perf-vname">LCP</div><div class="ag-perf-vval">'+fmtMs(d.lcp)+'</div></div>'
    +'<div class="ag-perf-vital '+vCls(d.cls!==null&&d.cls!==undefined?d.cls*1000:null,100,250)+'"><div class="ag-perf-vname">CLS</div><div class="ag-perf-vval">'+(d.cls!==null&&d.cls!==undefined?d.cls.toFixed(3):'—')+'</div></div>'
    +'<div class="ag-perf-vital '+vCls(d.inp,200,500)+'"><div class="ag-perf-vname">INP</div><div class="ag-perf-vval">'+fmtMs(d.inp)+'</div></div>'
    +'<div class="ag-perf-vital '+vCls(d.fcp,1800,3000)+'"><div class="ag-perf-vname">FCP</div><div class="ag-perf-vval">'+fmtMs(d.fcp)+'</div></div>'
    +'</div>'
    +'</div>';

  // Page Load Timing
  if(d.navTiming){
    var n=d.navTiming;
    html+='<div class="ag-perf-section">'
      +'<div class="ag-perf-title">Page Load</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:10px">'
      +'<div><span style="color:#c9d1d9">TTFB</span> <span style="color:#e6edf3;font-weight:600">'+fmtMs(n.ttfb)+'</span></div>'
      +'<div><span style="color:#c9d1d9">DNS</span> <span style="color:#e6edf3;font-weight:600">'+fmtMs(n.dns)+'</span></div>'
      +'<div><span style="color:#c9d1d9">DOMReady</span> <span style="color:#e6edf3;font-weight:600">'+fmtMs(n.domReady)+'</span></div>'
      +'<div><span style="color:#c9d1d9">Full Load</span> <span style="color:#e6edf3;font-weight:600">'+fmtMs(n.load)+'</span></div>'
      +'</div>'
      +(n.type&&n.type!=='navigate'?'<div style="font-size:9px;color:#d29922;margin-top:2px">⚠ Load type: '+esc(n.type)+'</div>':'')
      +'</div>';
  }

  // API Calls
  html+='<div class="ag-perf-section">'
    +'<div class="ag-perf-title">API Calls'
    +(d.total?'<span class="ag-perf-count">'+d.total+'</span>':'')
    +(d.errors?'<span class="ag-perf-err">'+d.errors+' errors</span>':'')
    +'</div>';
  if(d.total===0){
    html+='<div style="font-size:10px;color:#c9d1d9">No network requests captured yet.</div>';
  } else {
    if(d.seqCount>0){
      html+='<div class="ag-perf-warn">⚠ '+d.seqCount+' sequential request'+(d.seqCount>1?'s':'')
        +' detected — consider parallelizing</div>';
    }
    html+='<div style="font-size:10px;color:#c9d1d9;margin-bottom:2px">Avg latency: <b>'+fmtMs(d.avgDur)+'</b></div>';
    if(d.slowest.length){
      html+='<div class="ag-perf-subtitle">Slowest</div>';
      html+=d.slowest.map(function(r,i){
        var sc=r.status>=400||r.status===0?'ag-status-err':r.status>=300?'ag-status-warn':'ag-status-ok';
        var urlParts=r.url.split('?')[0].split('/');
        var shortUrl=urlParts.slice(-3).join('/');
        return '<div class="ag-perf-row">'
          +'<span class="ag-perf-ri">'+(i+1)+'</span>'
          +'<span class="ag-method">'+esc(r.method)+'</span>'
          +'<span class="ag-perf-url" title="'+esc(r.url)+'">'+esc(shortUrl)+'</span>'
          +'<span class="ag-perf-dur">'+fmtMs(r.duration)+'</span>'
          +'<span class="'+sc+'" style="font-size:10px;flex-shrink:0">'+r.status+'</span>'
          +'</div>';
      }).join('');
    }
  }
  html+='</div>';

  // Repeated Requests
  if(d.repeated.length){
    html+='<div class="ag-perf-section">'
      +'<div class="ag-perf-title">Repeated Requests</div>'
      +d.repeated.map(function(e){
        return '<div class="ag-perf-row">'
          +'<span class="ag-perf-url" title="'+esc(e[0])+'">'+esc(e[0])+'</span>'
          +'<span class="ag-perf-badge">&#215;'+e[1]+'</span>'
          +'</div>';
      }).join('')
      +'</div>';
  }

  // Long Tasks
  if(d.longTasks.length){
    html+='<div class="ag-perf-section">'
      +'<div class="ag-perf-title">Long Tasks <span class="ag-perf-count">'+d.longTasks.length+'</span></div>'
      +d.longTasks.slice(0,5).map(function(t){
        var dc=t.duration>150?'ag-perf-poor':t.duration>100?'ag-perf-needs':'ag-perf-good';
        return '<div class="ag-perf-row">'
          +'<span class="ag-perf-dur '+dc+'">'+Math.round(t.duration)+'ms</span>'
          +'<span style="font-size:10px;color:#c9d1d9">at '+fmtMs(Math.round(t.startTime))+'</span>'
          +'</div>';
      }).join('')
      +'</div>';
  }

  // Large Assets
  if(d.largeSorted.length){
    html+='<div class="ag-perf-section">'
      +'<div class="ag-perf-title">Large Assets</div>'
      +d.largeSorted.map(function(r){
        var big=r.size>500000;
        return '<div class="ag-perf-row">'
          +'<span class="ag-perf-url">'+esc(r.name)+'</span>'
          +'<span class="ag-perf-badge'+(big?' ag-perf-poor':'')+'">'+fmtSz(r.size)+'</span>'
          +'</div>';
      }).join('')
      +'</div>';
  }

  html+='</div>';
  el.innerHTML=html;

  // Wire: Send to Claude
  var sendBtn=$('ag-perf-send');
  if(sendBtn) sendBtn.addEventListener('click',function(){
    var btn=sendBtn;
    if(btn){ btn.disabled=true; btn.textContent='⏳ Sending…'; }
    send('/perf',{
      pageUrl:location.href,collectedAt:Date.now(),
      routes:S.routes,
      vitals:{lcp:d.lcp,cls:d.cls,inp:d.inp,fcp:d.fcp},
      navigation:d.navTiming,
      network:{total:d.total,errors:d.errors,avgDuration:d.avgDur,sequentialCount:d.seqCount,
        slowest:d.slowest.map(function(r){ return {method:r.method,url:r.url,duration:r.duration,status:r.status}; }),
        repeated:d.repeated.map(function(e){ return {key:e[0],count:e[1]}; })
      },
      longTasks:d.longTasks.slice(0,10),
      largeAssets:d.largeSorted
    });
    setTimeout(function(){
      if(btn){ btn.disabled=false; btn.textContent='✓ Sent'; }
      setTimeout(function(){ if(btn) btn.textContent='📤 Send to Claude'; },1500);
    },600);
  });

  // Wire: Analyze with Claude
  var auditBtn=$('ag-perf-audit');
  if(auditBtn) auditBtn.addEventListener('click', analyzeRoutesWithClaude);
}

function fmtDepBytes(b){
  if(!b) return '';
  if(b>=1048576) return (b/1048576).toFixed(1)+' MB';
  if(b>=1024) return (b/1024).toFixed(1)+' kB';
  return b+' B';
}

function fmtDepNum(n){
  if(!n) return '0';
  if(n>=1000000) return (n/1000000).toFixed(1)+'M';
  if(n>=1000) return Math.round(n/1000)+'k';
  return String(n);
}

function depVerdictClass(v){
  if(v==='ADOPT') return 'ag-dep-adopt';
  if(v==='REVIEW') return 'ag-dep-review';
  return 'ag-dep-reject';
}

function renderDepCard(report){
  var vc=depVerdictClass(report.verdict);
  var icon=report.verdict==='ADOPT'?'✓':report.verdict==='REVIEW'?'⚠':'✗';

  // Flags (duplicates, vulns, socket)
  var flagHtml='';
  var hasBadFlag=report.verdict==='REJECT'||report.vulnerabilities&&report.vulnerabilities.length>0||report.socket&&report.socket.malware;
  var flagClass=hasBadFlag?'ag-dep-flags ag-dep-reject-flag':'ag-dep-flags';
  var flags=[];
  if(report.vulnerabilities&&report.vulnerabilities.length>0) flags.push(report.vulnerabilities.length+' vuln'+( report.vulnerabilities.length>1?'s':''));
  if(report.socket&&report.socket.malware) flags.push('⚠ malware detected');
  if(report.socket&&report.socket.installScripts) flags.push('install scripts');
  if(report.socket&&report.socket.telemetry) flags.push('telemetry');
  if(report.project&&report.project.duplicates&&report.project.duplicates.length>0){
    var dup=report.project.duplicates[0];
    flags.push('duplicate of '+dup.name+' ('+dup.fileCount+' files)');
  }
  if(report.project&&report.project.layerViolation) flags.push('layer violation');
  if(flags.length) flagHtml='<div class="'+flagClass+'">'+flags.join(' · ')+'</div>';

  // Score bars
  var secPct=Math.round((report.score.security/40)*100);
  var mntPct=Math.round((report.score.maintenance/30)*100);
  var fitPct=Math.round((report.score.fit/30)*100);
  var secCol=secPct>75?'#3fb950':secPct>40?'#d29922':'#f85149';
  var mntCol=mntPct>75?'#3fb950':mntPct>40?'#d29922':'#f85149';
  var fitCol=fitPct>75?'#3fb950':fitPct>40?'#d29922':'#f85149';

  var metaParts=[];
  if(report.registry){
    metaParts.push('license '+( report.registry.license||'UNKNOWN'));
    if(report.bundle&&report.bundle.available) metaParts.push(fmtDepBytes(report.bundle.gzip)+' gzip');
    metaParts.push(fmtDepNum(report.registry.weeklyDownloads)+'/wk');
    metaParts.push(report.registry.daysSincePublish+'d ago');
  }

  return '<div class="ag-dep-card">'
    +'<div class="ag-dep-card-hdr">'
    +'<span class="ag-dep-name">'+report.name+'<span class="ag-dep-version">@'+report.resolvedVersion+'</span></span>'
    +'<span class="ag-dep-verdict '+vc+'">'+icon+' '+report.verdict+'</span>'
    +'</div>'
    +'<div class="ag-dep-body">'
    +'<div class="ag-dep-score-row"><span class="ag-dep-score-label">Security</span><div class="ag-dep-bar-wrap"><div class="ag-dep-bar" style="width:'+secPct+'%;background:'+secCol+'"></div></div><span class="ag-dep-score-val">'+report.score.security+'/40</span></div>'
    +'<div class="ag-dep-score-row"><span class="ag-dep-score-label">Maintenance</span><div class="ag-dep-bar-wrap"><div class="ag-dep-bar" style="width:'+mntPct+'%;background:'+mntCol+'"></div></div><span class="ag-dep-score-val">'+report.score.maintenance+'/30</span></div>'
    +'<div class="ag-dep-score-row"><span class="ag-dep-score-label">Fit</span><div class="ag-dep-bar-wrap"><div class="ag-dep-bar" style="width:'+fitPct+'%;background:'+fitCol+'"></div></div><span class="ag-dep-score-val">'+report.score.fit+'/30</span></div>'
    +flagHtml
    +(metaParts.length?'<div class="ag-dep-meta">'+metaParts.join(' · ')+'</div>':'')
    +'</div>'
    +'</div>';
}

function renderDeps(){
  var el=$('ag-content');
  if(!el) return;
  el.innerHTML='';

  var wrap=document.createElement('div');
  wrap.style.cssText='padding:10px;height:100%;overflow-y:auto;box-sizing:border-box';

  var checkHtml='<div class="ag-dep-check">'
    +'<input class="ag-dep-input" id="ag-dep-input" placeholder="package[@version] — e.g. got or got@14" value="'+(S.deps.checkInput||'')+'">'
    +'<button class="ag-dep-btn" id="ag-dep-check-btn">Check</button>'
    +'</div>';

  var resultHtml='';
  if(S.deps.checkStatus==='loading'){
    resultHtml='<div class="ag-dep-loading">Evaluating package…</div>';
  } else if(S.deps.checkStatus==='error'){
    resultHtml='<div class="ag-dep-flags ag-dep-reject-flag" style="margin-bottom:10px">'+S.deps.checkError+'</div>';
  } else if(S.deps.checkStatus==='done'&&S.deps.checkResult){
    resultHtml=renderDepCard(S.deps.checkResult);
  }

  var auditHtml='<div class="ag-dep-audit-title"><span>Installed dependency health</span>'
    +'<div style="display:flex;align-items:center;gap:5px">'
    +'<span style="font-size:9px;color:#8b949e;font-weight:400">Show:</span>'
    +'<button class="ag-dep-limit-btn'+(S.deps.auditLimit===10?' ag-dep-limit-active':'')+'" data-limit="10">10</button>'
    +'<button class="ag-dep-limit-btn'+(S.deps.auditLimit===20?' ag-dep-limit-active':'')+'" data-limit="20">20</button>'
    +'<button class="ag-dep-limit-btn'+(S.deps.auditLimit===0?' ag-dep-limit-active':'')+'" data-limit="0">All</button>'
    +'<button class="ag-dep-btn" id="ag-dep-refresh-btn" style="font-size:10px;padding:3px 8px">↻ Refresh</button>'
    +'</div>'
    +'</div>';

  if(S.deps.auditLoading){
    auditHtml+='<div class="ag-dep-loading">Scanning dependencies…</div>';
  } else if(S.deps.auditData&&S.deps.auditData.length>0){
    S.deps.auditData.forEach(function(r){ auditHtml+=renderDepCard(r); });
  } else if(S.deps.auditData){
    auditHtml+='<div class="ag-dep-loading">All scanned dependencies look healthy ✓</div>';
  } else {
    auditHtml+='<div class="ag-dep-loading" style="cursor:pointer">Click ↻ Refresh to scan installed dependencies</div>';
  }

  wrap.innerHTML=checkHtml+resultHtml+auditHtml;
  el.appendChild(wrap);

  // Wire check button
  var checkBtn=$('ag-dep-check-btn');
  var inp=$('ag-dep-input');
  if(inp) inp.addEventListener('input',function(){ S.deps.checkInput=inp.value; });
  if(inp) inp.addEventListener('keydown',function(e){ if(e.key==='Enter') runDepCheck(); });
  if(checkBtn) checkBtn.addEventListener('click', runDepCheck);

  // Wire limit buttons
  var limitBtns=__shadow.querySelectorAll('.ag-dep-limit-btn');
  limitBtns.forEach(function(btn){
    btn.addEventListener('click',function(){
      var lim=parseInt(btn.dataset.limit||'10',10);
      S.deps.auditLimit=lim;
      loadDepAudit();
    });
  });

  // Wire refresh button
  var refreshBtn=$('ag-dep-refresh-btn');
  if(refreshBtn) refreshBtn.addEventListener('click', loadDepAudit);
}

function runDepCheck(){
  var pkg=(S.deps.checkInput||'').trim();
  if(!pkg) return;
  S.deps.checkStatus='loading';
  S.deps.checkResult=null;
  S.deps.checkError='';
  renderDeps();
  fetch(AG_BASE+'/dep/check',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:pkg.includes('@')&&pkg.indexOf('@')>0?pkg.slice(0,pkg.lastIndexOf('@')):pkg,
      version:pkg.includes('@')&&pkg.indexOf('@')>0?pkg.slice(pkg.lastIndexOf('@')+1):undefined})
  }).then(function(r){ return r.json(); }).then(function(data){
    if(data&&data.error){
      S.deps.checkError=String(data.error);
      S.deps.checkStatus='error';
    } else {
      S.deps.checkResult=data;
      S.deps.checkStatus='done';
    }
    if(S.open&&S.tab==='deps') renderDeps();
  }).catch(function(e){
    S.deps.checkError='Could not reach arcguard server. Is arcguard dev running? ('+String(e)+')';
    S.deps.checkStatus='error';
    if(S.open&&S.tab==='deps') renderDeps();
  });
}

function loadDepAudit(){
  S.deps.auditLoading=true;
  if(S.open&&S.tab==='deps') renderDeps();
  var limitParam=S.deps.auditLimit===0?'999':String(S.deps.auditLimit);
  fetch(AG_BASE+'/dep/audit?limit='+limitParam)
    .then(function(r){ return r.json(); })
    .then(function(data){
      S.deps.auditData=Array.isArray(data)?data:[];
      S.deps.auditLoading=false;
      if(S.open&&S.tab==='deps') renderDeps();
    }).catch(function(){
      S.deps.auditData=[];
      S.deps.auditLoading=false;
      if(S.open&&S.tab==='deps') renderDeps();
    });
}

function renderAI(){
  const el=$('ag-content');
  if(!el) return;
  el.innerHTML='';

  const wrap=document.createElement('div');
  wrap.id='ag-ai';
  wrap.innerHTML=\`
<div id="ag-chat-msgs"></div>
<div id="ag-ctx-bar"></div>
<div id="ag-chat-input-row">
  <textarea id="ag-ai-q" placeholder="Why is the Save button not working?" rows="2"></textarea>
  <button class="ag-btn ag-btn-primary" id="ag-send-btn" title="Ask Claude (Enter)">▶</button>
</div>
<div id="ag-chat-hint">Toggle chips above to control what context is sent · Shift+Enter for new line</div>
\`;
  el.appendChild(wrap);

  renderChatMessages();
  renderContextBar();

  const qa=$('ag-ai-q');
  const sendBtn=$('ag-send-btn');

  qa.addEventListener('keydown',function(e){
    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); askClaude(); }
  });
  sendBtn.addEventListener('click', askClaude);
}

function renderChatMessages(){
  const el=$('ag-chat-msgs');
  if(!el) return;
  if(!AI.messages.length){
    el.innerHTML='<div class="ag-empty" style="padding:20px 16px">Ask Claude anything about your app — errors and network failures are included automatically.</div>';
    return;
  }
  el.innerHTML=AI.messages.map(function(m){
    const cls=m.role==='user'?'ag-msg-user':'ag-msg-claude';
    const label=m.role==='user'?'You':'Claude';
    return '<div class="ag-msg '+cls+'">'
      +'<div class="ag-msg-label">'+label+'</div>'
      +'<div class="ag-msg-body">'+esc(m.content)+'</div>'
      +'</div>';
  }).join('');
  el.scrollTop=el.scrollHeight;
}

function askClaude(){
  if(AI.streaming) return;
  const qa=$('ag-ai-q');
  const sendBtn=$('ag-send-btn');
  if(!qa) return;
  const question=qa.value.trim();
  if(!question) return;

  qa.value='';
  AI.messages.push({role:'user',content:question});
  AI.messages.push({role:'claude',content:''});
  AI.streaming=true;
  if(sendBtn){ sendBtn.disabled=true; sendBtn.textContent='…'; }
  renderChatMessages();

  const context=buildContextPrompt('');
  const es=new EventSource(AG_BASE+'/ask?_='+Date.now());

  // We can't POST with EventSource, so use fetch + ReadableStream instead
  es.close();

  const idx=AI.messages.length-1;
  fetch(AG_BASE+'/ask',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({question:question,context:context})
  }).then(function(resp){
    if(!resp.body){ throw new Error('No response body'); }
    const reader=resp.body.getReader();
    const decoder=new TextDecoder();
    let buf='';

    function pump(){
      reader.read().then(function(d){
        if(d.done){ finish(); return; }
        buf+=decoder.decode(d.value,{stream:true});
        // Parse SSE lines
        const lines=buf.split('\\n');
        buf=lines.pop()||'';
        lines.forEach(function(line){
          if(line.startsWith('data:')){
            try{
              const payload=JSON.parse(line.slice(5).trim());
              if(typeof payload==='string'){
                AI.messages[idx].content+=payload;
                renderChatMessages();
              }
            }catch(e){}
          }
          if(line.startsWith('event: done')){ finish(); }
        });
        pump();
      }).catch(finish);
    }
    pump();
  }).catch(function(err){
    AI.messages[idx].content='Error: '+String(err)+'. Make sure \`arcguard dev\` is running.';
    finish();
  });

  function finish(){
    AI.streaming=false;
    if(sendBtn){ sendBtn.disabled=false; sendBtn.textContent='▶'; }
    renderChatMessages();
  }
}

/* ── Boot ───────────────────────────────────────────────────────────────── */
initPerfObservers();
initRouteTracking();
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',inject);
} else {
  inject();
}

})();`;
}
//# sourceMappingURL=widget-script.js.map