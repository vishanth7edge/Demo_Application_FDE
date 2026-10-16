"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHtmlReport = generateHtmlReport;
function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function fmtBytes(b) {
    if (b >= 1048576)
        return `${(b / 1048576).toFixed(1)} MB`;
    if (b >= 1024)
        return `${(b / 1024).toFixed(1)} kB`;
    return `${b} B`;
}
function fmtNum(n) {
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${(n / 1000).toFixed(0)}k`;
    return String(n);
}
function verdictBadge(verdict) {
    const map = {
        ADOPT: 'badge-adopt',
        REVIEW: 'badge-review',
        REJECT: 'badge-reject',
    };
    const icon = verdict === 'ADOPT' ? '✓' : verdict === 'REVIEW' ? '⚠' : '✗';
    return `<span class="badge ${map[verdict] ?? ''}">${icon} ${esc(verdict)}</span>`;
}
function scoreBar(value, max, color) {
    const pct = Math.round((value / max) * 100);
    return `<div class="bar-wrap"><div class="bar" style="width:${pct}%;background:${color}"></div></div>`;
}
function renderMaintDetail(registry, github) {
    const chips = [
        `<span class="maint-chip">📅 Last publish: ${registry.daysSincePublish}d ago</span>`,
        `<span class="maint-chip">🚀 ${registry.releasesLastYear} release${registry.releasesLastYear !== 1 ? 's' : ''} / year</span>`,
        `<span class="maint-chip">👤 ${registry.maintainerCount} maintainer${registry.maintainerCount !== 1 ? 's' : ''}</span>`,
        `<span class="maint-chip">📦 ${fmtNum(registry.weeklyDownloads)} dl/wk</span>`,
    ];
    if (github.available) {
        if (github.daysSinceLastCommit !== null)
            chips.push(`<span class="maint-chip">💻 Last commit: ${github.daysSinceLastCommit}d ago</span>`);
        if (github.openIssues !== null)
            chips.push(`<span class="maint-chip">🐛 ${github.openIssues} open issues</span>`);
        if (github.stars !== null)
            chips.push(`<span class="maint-chip">⭐ ${fmtNum(github.stars)} stars</span>`);
    }
    return `<div class="maint-chips">${chips.join('')}</div>`;
}
function renderUpdateSection(r) {
    const installed = r.project.installedVersion ?? r.project.currentVersion;
    const latest = r.registry.latestVersion;
    const ut = r.updateType;
    if (!installed || !latest || ut === 'none' || ut === 'unknown')
        return '';
    const typeLabel = ut.toUpperCase();
    const typeCls = ut === 'major' ? 'upd-major' : ut === 'minor' ? 'upd-minor' : 'upd-patch';
    const fileRows = r.project.usageFiles.slice(0, 8).map(f => `<div class="upd-file">📄 ${esc(f)}</div>`).join('');
    const moreFiles = r.project.usageFiles.length > 8
        ? `<div class="upd-file upd-more">… and ${r.project.usageFiles.length - 8} more files</div>` : '';
    const fixedByUpgrade = r.vulnerabilities.length > 0 && r.latestVulnerabilities.length === 0;
    const stillVulnerable = r.latestVulnerabilities.length > 0;
    const breakingNote = ut === 'major'
        ? `<div class="upd-breaking">⚠ Major version upgrade — breaking changes are likely. Review the changelog before upgrading.</div>` : '';
    const vulnFixNote = fixedByUpgrade
        ? `<div class="upd-fix">✓ Upgrading to ${esc(latest)} fixes all ${r.vulnerabilities.length} vulnerabilit${r.vulnerabilities.length !== 1 ? 'ies' : 'y'} found in ${esc(installed)}.</div>`
        : stillVulnerable
            ? `<div class="upd-still-vuln">⚠ Latest version (${esc(latest)}) still has ${r.latestVulnerabilities.length} vulnerabilit${r.latestVulnerabilities.length !== 1 ? 'ies' : 'y'} — upgrading alone won't fix this.</div>`
            : '';
    const changelogLink = r.registry.changelogUrl
        ? `<a class="upd-changelog" href="${esc(r.registry.changelogUrl)}" target="_blank">View changelog / releases →</a>` : '';
    const impactBlock = r.project.usageFiles.length > 0 ? `
    <div class="upd-impact-title">${r.project.usageFiles.length} file${r.project.usageFiles.length !== 1 ? 's' : ''} in this project import <strong>${esc(r.name)}</strong> and may be affected:</div>
    <div class="upd-files">${fileRows}${moreFiles}</div>
  ` : `<div class="upd-impact-title">Package not yet imported in project source.</div>`;
    return `
  <div class="upd-box">
    <div class="upd-hdr">
      <span class="upd-label">↑ Update available</span>
      <span class="upd-versions">${esc(installed)} → <strong>${esc(latest)}</strong></span>
      <span class="upd-type ${typeCls}">${typeLabel}</span>
    </div>
    ${breakingNote}
    ${vulnFixNote}
    ${impactBlock}
    ${changelogLink}
  </div>`;
}
function renderVulnPriorityBadge(r) {
    if (!r.vulnPriority)
        return '';
    const [label, cls] = r.vulnPriority === 'used+vulnerable' ? ['🔴 USED · VULNERABLE', 'priority-used'] :
        r.vulnPriority === 'installed+vulnerable' ? ['🟠 INSTALLED · VULNERABLE', 'priority-installed'] :
            ['🟡 TRANSITIVE · VULNERABLE', 'priority-transitive'];
    return `<div class="priority-badge ${cls}">${label}</div>`;
}
function renderFitBreakdown(r) {
    const fb = r.score.fitBreakdown;
    if (fb.noDuplicate && fb.noLayerViolation && fb.licenseOk)
        return '';
    const items = [];
    if (!fb.noDuplicate)
        items.push(`<span class="fit-item fit-warn">⚠ Duplicate: ${esc(fb.duplicateNote)}</span>`);
    if (!fb.noLayerViolation)
        items.push(`<span class="fit-item fit-err">✗ Layer violation</span>`);
    if (!fb.licenseOk)
        items.push(`<span class="fit-item fit-warn">⚠ License concern</span>`);
    return `<div class="fit-breakdown">${items.join('')}</div>`;
}
function renderCard(r) {
    const vulnRows = r.vulnerabilities.slice(0, 5).map(v => {
        const sev = v.severity;
        const cls = sev === 'critical' || sev === 'high' ? 'sev-high' : sev === 'moderate' ? 'sev-mod' : 'sev-low';
        const ids = [v.id, v.ghsa].filter(Boolean).join(' / ');
        const cvss = v.cvssScore !== null ? ` · CVSS ${v.cvssScore.toFixed(1)}` : '';
        return `<div class="vuln-row">
      <span class="sev-badge ${cls}">${esc(sev.toUpperCase())}${esc(cvss)}</span>
      <div>
        <div class="vuln-title">${esc(v.title)}</div>
        <div class="vuln-meta">${esc(ids)}  ·  affected: ${esc(v.range)}</div>
        ${v.url ? `<a class="vuln-link" href="${esc(v.url)}" target="_blank">${esc(v.url)}</a>` : ''}
      </div>
    </div>`;
    }).join('');
    const socketFlags = [
        r.socket.malware && 'malware',
        r.socket.installScripts && 'install-scripts',
        r.socket.obfuscatedCode && 'obfuscated-code',
        r.socket.protestware && 'protestware',
        r.socket.telemetry && 'telemetry',
    ].filter(Boolean);
    const dupRows = r.project.duplicates.map(d => `<div class="dup-row">
      <strong>${esc(d.name)}</strong> already imported in ${d.fileCount} file${d.fileCount !== 1 ? 's' : ''} —
      category: <em>${esc(d.category)}</em>
    </div>`).join('');
    const meta = [
        `License: ${esc(r.registry.license || 'UNKNOWN')}`,
        r.bundle.available ? `Bundle: +${esc(fmtBytes(r.bundle.gzip))} gzip` : '',
        `Weekly DL: ${esc(fmtNum(r.registry.weeklyDownloads))}`,
        r.registry.maintainerCount > 0 ? `${r.registry.maintainerCount} maintainer${r.registry.maintainerCount !== 1 ? 's' : ''}` : '',
        r.registry.daysSincePublish < 9999 ? `Last publish: ${r.registry.daysSincePublish}d ago` : '',
    ].filter(Boolean).join('  ·  ');
    return `
  <div class="card card-${r.verdict.toLowerCase()}">
    <div class="card-hdr">
      <div class="pkg-name">${esc(r.name)}<span class="pkg-ver">@${esc(r.resolvedVersion)}</span></div>
      ${verdictBadge(r.verdict)}
    </div>
    <div class="card-body">
      <div class="scores">
        <div class="score-row">
          <span class="score-lbl">Security</span>
          ${scoreBar(r.score.security, 40, '#3fb950')}
          <span class="score-val">${r.score.security}/40</span>
          <span class="score-note">${r.vulnerabilities.length === 0 ? '0 vulns' : `${r.vulnerabilities.length} vuln${r.vulnerabilities.length > 1 ? 's' : ''}`}</span>
        </div>
        <div class="score-row">
          <span class="score-lbl">Maintenance</span>
          ${scoreBar(r.score.maintenance, 30, '#58a6ff')}
          <span class="score-val">${r.score.maintenance}/30</span>
          <span class="score-note">${r.registry.releasesLastYear} rel/yr · ${r.registry.maintainerCount} maintainer${r.registry.maintainerCount !== 1 ? 's' : ''}</span>
        </div>
        <div class="score-row">
          <span class="score-lbl">Fit</span>
          ${scoreBar(r.score.fit, 30, r.score.fit >= 20 ? '#3fb950' : r.score.fit >= 10 ? '#d29922' : '#f85149')}
          <span class="score-val">${r.score.fit}/30</span>
          <span class="score-note">${r.score.fitBreakdown.noDuplicate ? '✓ no duplicate' : '⚠ duplicate'} · ${r.score.fitBreakdown.noLayerViolation ? '✓ layer ok' : '✗ layer'} · ${r.score.fitBreakdown.licenseOk ? '✓ license' : '⚠ license'}</span>
        </div>
        <div class="total-score">Total: <strong>${r.score.total}</strong> / 100</div>
      </div>
      ${renderFitBreakdown(r)}
      ${renderMaintDetail(r.registry, r.github)}

      ${renderVulnPriorityBadge(r)}
      ${renderUpdateSection(r)}
      ${r.vulnerabilities.length > 0 ? `<div class="section-title sec-red">✗ Vulnerabilities</div><div class="vulns">${vulnRows}</div>` : ''}
      ${socketFlags.length > 0 ? `<div class="section-title sec-yellow">⚠ Supply-chain flags</div><div class="flags">${socketFlags.map(f => `<span class="flag-tag">${esc(f)}</span>`).join('')}</div>` : ''}
      ${dupRows ? `<div class="section-title sec-yellow">⚠ Potential duplicate</div><div class="dups">${dupRows}</div>` : ''}
      ${r.project.layerViolation ? `<div class="section-title sec-red">✗ Layer violation</div><div class="layer-note">${esc(r.project.layerViolationReason)}</div>` : ''}

      <div class="verdict-reason">${esc(r.verdictReason)}</div>
      <div class="meta-line">${meta}</div>
    </div>
  </div>`;
}
function summary(reports) {
    const adopt = reports.filter(r => r.verdict === 'ADOPT').length;
    const review = reports.filter(r => r.verdict === 'REVIEW').length;
    const reject = reports.filter(r => r.verdict === 'REJECT').length;
    const totalVulns = reports.reduce((s, r) => s + r.vulnerabilities.length, 0);
    return `
  <div class="summary">
    <div class="sum-card sum-adopt"><div class="sum-num">${adopt}</div><div class="sum-lbl">ADOPT</div></div>
    <div class="sum-card sum-review"><div class="sum-num">${review}</div><div class="sum-lbl">REVIEW</div></div>
    <div class="sum-card sum-reject"><div class="sum-num">${reject}</div><div class="sum-lbl">REJECT</div></div>
    <div class="sum-card sum-vuln"><div class="sum-num">${totalVulns}</div><div class="sum-lbl">Vulnerabilities</div></div>
    <div class="sum-card"><div class="sum-num">${reports.length}</div><div class="sum-lbl">Total Scanned</div></div>
  </div>`;
}
function generateHtmlReport(reports, projectRoot) {
    const now = new Date().toLocaleString();
    const cards = reports.map(renderCard).join('');
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ArcGuard Dependency Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;background:#0d1117;color:#e6edf3;font-size:13px;line-height:1.5}
  a{color:#58a6ff}

  /* Header */
  .page-hdr{background:linear-gradient(135deg,#0badbc,#0078d7);padding:28px 40px;display:flex;align-items:center;justify-content:space-between}
  .page-hdr h1{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.3px}
  .page-hdr .sub{font-size:11px;color:rgba(255,255,255,.75);margin-top:3px}
  .print-btn{background:#fff;color:#0078d7;border:none;border-radius:6px;font-size:12px;font-weight:700;padding:8px 18px;cursor:pointer}
  .print-btn:hover{background:#e6edf3}
  @media print{.print-btn{display:none}.page-hdr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}

  /* Summary */
  .summary{display:flex;gap:12px;flex-wrap:wrap;padding:20px 40px;background:#161b22;border-bottom:1px solid #21262d}
  .sum-card{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px 20px;min-width:110px;text-align:center}
  .sum-num{font-size:28px;font-weight:800;line-height:1}
  .sum-lbl{font-size:10px;color:#8b949e;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
  .sum-adopt .sum-num{color:#3fb950}
  .sum-review .sum-num{color:#d29922}
  .sum-reject .sum-num{color:#f85149}
  .sum-vuln .sum-num{color:#f85149}

  /* Cards */
  .cards{padding:20px 40px;display:grid;gap:14px}
  .card{border-radius:8px;overflow:hidden;border:1px solid #30363d}
  .card-adopt{border-color:rgba(63,185,80,.3)}
  .card-review{border-color:rgba(210,153,34,.3)}
  .card-reject{border-color:rgba(248,81,73,.3)}
  .card-hdr{padding:10px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #21262d;background:#161b22}
  .pkg-name{font-size:14px;font-weight:700;font-family:monospace}
  .pkg-ver{font-size:11px;font-weight:400;color:#8b949e;margin-left:2px}
  .badge{font-size:11px;font-weight:800;padding:3px 10px;border-radius:12px;letter-spacing:.05em}
  .badge-adopt{background:rgba(63,185,80,.14);color:#3fb950;border:1px solid rgba(63,185,80,.3)}
  .badge-review{background:rgba(210,153,34,.12);color:#d29922;border:1px solid rgba(210,153,34,.25)}
  .badge-reject{background:rgba(248,81,73,.1);color:#f85149;border:1px solid rgba(248,81,73,.2)}

  .card-body{padding:12px 16px;background:#0d1117}

  /* Scores */
  .scores{margin-bottom:10px}
  .score-row{display:grid;grid-template-columns:90px 1fr 44px 80px;align-items:center;gap:8px;margin-bottom:5px}
  .score-lbl{font-size:10px;color:#8b949e}
  .score-val{font-size:10px;color:#8b949e;text-align:right;font-variant-numeric:tabular-nums}
  .score-note{font-size:10px;color:#6e7681}
  .bar-wrap{height:5px;background:#21262d;border-radius:3px;overflow:hidden}
  .bar{height:100%;border-radius:3px;transition:width .3s}
  .total-score{font-size:11px;color:#8b949e;text-align:right;margin-top:2px}

  /* Sections */
  .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin:10px 0 5px}
  .sec-red{color:#f85149}
  .sec-yellow{color:#d29922}

  /* Vulns */
  .vuln-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:7px}
  .sev-badge{font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;white-space:nowrap;flex-shrink:0;margin-top:1px}
  .sev-high{background:rgba(248,81,73,.15);color:#f85149;border:1px solid rgba(248,81,73,.3)}
  .sev-mod{background:rgba(210,153,34,.12);color:#d29922;border:1px solid rgba(210,153,34,.25)}
  .sev-low{background:rgba(139,148,158,.1);color:#8b949e;border:1px solid #30363d}
  .vuln-title{font-size:11px;color:#e6edf3;font-weight:600}
  .vuln-meta{font-size:10px;color:#8b949e;font-family:monospace}
  .vuln-link{font-size:10px;color:#58a6ff;word-break:break-all}

  /* Flags */
  .flags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}
  .flag-tag{font-size:10px;padding:2px 8px;border-radius:4px;background:rgba(248,81,73,.1);color:#f85149;border:1px solid rgba(248,81,73,.2)}

  /* Dups */
  .dup-row{font-size:11px;color:#d29922;margin-bottom:4px}
  .layer-note{font-size:11px;color:#f85149;margin-bottom:4px}

  /* Footer */
  .verdict-reason{font-size:11px;color:#8b949e;font-style:italic;margin-top:8px;padding-top:8px;border-top:1px solid #21262d}
  .meta-line{font-size:10px;color:#6e7681;margin-top:5px}

  /* Vulnerability priority badge */
  .priority-badge{font-size:11px;font-weight:700;padding:5px 10px;border-radius:4px;margin-bottom:10px;display:inline-block}
  .priority-used{background:rgba(248,81,73,.12);color:#f85149;border:1px solid rgba(248,81,73,.3)}
  .priority-installed{background:rgba(210,153,34,.1);color:#d29922;border:1px solid rgba(210,153,34,.25)}
  .priority-transitive{background:rgba(139,148,158,.1);color:#8b949e;border:1px solid #30363d}

  /* Fit breakdown */
  .fit-breakdown{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
  .fit-item{font-size:10px;padding:2px 8px;border-radius:4px}
  .fit-warn{background:rgba(210,153,34,.1);color:#d29922;border:1px solid rgba(210,153,34,.2)}
  .fit-err{background:rgba(248,81,73,.08);color:#f85149;border:1px solid rgba(248,81,73,.2)}

  /* Maintenance detail chips */
  .maint-chips{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
  .maint-chip{font-size:10px;padding:2px 8px;border-radius:12px;background:#161b22;border:1px solid #30363d;color:#8b949e;white-space:nowrap}

  /* Update section */
  .upd-box{background:rgba(210,153,34,.06);border:1px solid rgba(210,153,34,.2);border-radius:6px;padding:10px 14px;margin:10px 0}
  .upd-hdr{display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap}
  .upd-label{font-size:11px;font-weight:700;color:#d29922}
  .upd-versions{font-size:12px;font-family:monospace;color:#e6edf3}
  .upd-type{font-size:10px;font-weight:800;padding:2px 8px;border-radius:4px;letter-spacing:.05em}
  .upd-major{background:rgba(248,81,73,.15);color:#f85149;border:1px solid rgba(248,81,73,.3)}
  .upd-minor{background:rgba(210,153,34,.12);color:#d29922;border:1px solid rgba(210,153,34,.25)}
  .upd-patch{background:rgba(63,185,80,.1);color:#3fb950;border:1px solid rgba(63,185,80,.2)}
  .upd-breaking{font-size:11px;color:#f85149;background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.2);border-radius:4px;padding:5px 8px;margin-bottom:8px}
  .upd-impact-title{font-size:11px;color:#c9d1d9;margin-bottom:5px}
  .upd-files{display:flex;flex-direction:column;gap:3px;margin-bottom:6px}
  .upd-file{font-size:10px;font-family:monospace;color:#8b949e;padding:2px 0}
  .upd-more{color:#6e7681;font-style:italic}
  .upd-fix{font-size:11px;color:#3fb950;background:rgba(63,185,80,.08);border:1px solid rgba(63,185,80,.2);border-radius:4px;padding:5px 8px;margin-bottom:8px}
  .upd-still-vuln{font-size:11px;color:#f85149;background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.2);border-radius:4px;padding:5px 8px;margin-bottom:8px}
  .upd-changelog{font-size:11px;color:#58a6ff;text-decoration:none}
  .upd-changelog:hover{text-decoration:underline}

  /* Page footer */
  .page-footer{text-align:center;padding:24px;font-size:10px;color:#6e7681;border-top:1px solid #21262d}

  @media print{
    body{background:#fff;color:#000}
    .page-hdr{background:#0078d7!important}
    .card,.card-hdr,.card-body,.summary{background:#fff!important;border-color:#ddd!important}
    .sum-card{background:#f6f8fa!important}
    .bar-wrap{background:#eee!important}
    .card{page-break-inside:avoid}
    .upd-box{background:#fffbea!important;border-color:#d29922!important}
    .upd-breaking{background:#fff0f0!important}
    a.upd-changelog::after{content:" (" attr(href) ")";font-size:9px;color:#555;word-break:break-all}
    a[href].vuln-link::after{content:" (" attr(href) ")";font-size:9px;color:#555;word-break:break-all}
  }
</style>
</head>
<body>

<div class="page-hdr">
  <div>
    <h1>ArcGuard · Dependency Report</h1>
    <div class="sub">Project: ${esc(projectRoot)}  ·  Generated: ${esc(now)}</div>
  </div>
  <button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>
</div>

${summary(reports)}

<div class="cards">
${cards}
</div>

<div class="page-footer">
  Generated by <strong>ArcGuard</strong> (@7edge/arcguard) — ${esc(now)}
</div>

</body>
</html>`;
}
//# sourceMappingURL=report.js.map