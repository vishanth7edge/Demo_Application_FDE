"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeScore = computeScore;
exports.computeVerdict = computeVerdict;
function computeScore(vulns, socket, registry, project, github) {
    // ── Security (0–40) ──────────────────────────────────────────────────────
    let security = 40;
    for (const v of vulns) {
        if (v.severity === 'low')
            security -= 5;
        if (v.severity === 'moderate')
            security -= 10;
        if (v.severity === 'high')
            security -= 20;
        if (v.severity === 'critical')
            security -= 40;
    }
    security = Math.max(0, security);
    // ── Maintenance (0–30) ───────────────────────────────────────────────────
    // Signal 1 — recency of last publish (0–16)
    let maintenance = 0;
    const days = registry.daysSincePublish;
    if (days < 7)
        maintenance += 16;
    else if (days < 30)
        maintenance += 13;
    else if (days < 90)
        maintenance += 9;
    else if (days < 365)
        maintenance += 4;
    // Signal 2 — release frequency last 12 months (0–6)
    const rel = registry.releasesLastYear;
    if (rel >= 12)
        maintenance += 6;
    else if (rel >= 6)
        maintenance += 5;
    else if (rel >= 3)
        maintenance += 3;
    else if (rel >= 1)
        maintenance += 1;
    // Signal 3 — maintainer count / bus factor (0–4)
    const mc = registry.maintainerCount;
    if (mc >= 3)
        maintenance += 4;
    else if (mc === 2)
        maintenance += 3;
    else if (mc === 1)
        maintenance += 1; // single maintainer = bus-factor risk
    // Signal 4 — popularity as proxy for longevity (0–2)
    if (registry.weeklyDownloads > 1000000)
        maintenance += 2;
    else if (registry.weeklyDownloads > 100000)
        maintenance += 1;
    // Signal 5 — GitHub activity (0–2, graceful — skipped if unavailable)
    if (github.available) {
        if (github.daysSinceLastCommit !== null && github.daysSinceLastCommit < 90)
            maintenance += 1;
        if (github.openIssues !== null && github.openIssues < 50)
            maintenance += 1;
    }
    maintenance = Math.min(30, maintenance);
    if (registry.deprecated)
        maintenance = Math.max(0, maintenance - 20);
    // ── Fit (0–30) ──────────────────────────────────────────────────────────
    let fit = 0;
    const noDuplicate = project.duplicates.length === 0;
    const noLayerViolation = !project.layerViolation;
    const licenseOk = project.licenseOk;
    if (noDuplicate) {
        fit += 15;
    }
    else {
        const maxUsage = Math.max(...project.duplicates.map(d => d.fileCount));
        if (maxUsage < 3)
            fit += 8; // low-usage duplicate → partial credit
    }
    if (noLayerViolation)
        fit += 10;
    if (licenseOk)
        fit += 5;
    const duplicateNote = project.duplicates.length > 0
        ? `${project.duplicates[0].name} already imported in ${project.duplicates[0].fileCount} file${project.duplicates[0].fileCount !== 1 ? 's' : ''} (${project.duplicates[0].category})`
        : '';
    const fitBreakdown = { noDuplicate, noLayerViolation, licenseOk, duplicateNote };
    const total = security + maintenance + fit;
    return { security, maintenance, fit, total, fitBreakdown };
}
function computeVerdict(score, vulns, socket, registry) {
    // ── Hard REJECT ────────────────────────────────────────────────────────────
    if (socket.malware) {
        return { verdict: 'REJECT', reason: 'socket.dev flagged this package as malware.' };
    }
    if (vulns.some(v => v.severity === 'critical')) {
        return { verdict: 'REJECT', reason: 'Package has critical vulnerabilities with no safe version range.' };
    }
    if (registry.deprecated) {
        return { verdict: 'REJECT', reason: `Package is deprecated: "${registry.deprecated}"` };
    }
    // ── Maintenance gate — prevent stale packages sneaking into ADOPT ──────────
    // A package with 0 releases in a year and last publish > 2 years ago
    // cannot be called "actively maintained" regardless of security score.
    const isStale = registry.daysSincePublish > 730 && registry.releasesLastYear === 0;
    const maintenancePoor = score.maintenance < 10;
    if (isStale || maintenancePoor) {
        // Still ADOPT if total is very high AND stale is the only concern
        if (score.total >= 75 && !maintenancePoor && vulns.length === 0) {
            return { verdict: 'ADOPT', reason: buildAdoptReason(score, registry) };
        }
        // Otherwise force at least REVIEW
        if (score.total >= 45) {
            return { verdict: 'REVIEW', reason: buildReviewReason(score, vulns, socket, registry) };
        }
        return { verdict: 'REJECT', reason: buildRejectReason(score, vulns, registry) };
    }
    // ── Score-based ────────────────────────────────────────────────────────────
    if (score.total >= 75)
        return { verdict: 'ADOPT', reason: buildAdoptReason(score, registry) };
    if (score.total >= 45)
        return { verdict: 'REVIEW', reason: buildReviewReason(score, vulns, socket, registry) };
    return { verdict: 'REJECT', reason: buildRejectReason(score, vulns, registry) };
}
function buildAdoptReason(score, registry) {
    const parts = ['Security is healthy.'];
    if (score.maintenance >= 20) {
        parts.push('Actively maintained.');
    }
    else if (score.maintenance >= 10) {
        parts.push('Maintenance is acceptable.');
    }
    else {
        // Stale but otherwise fine — be honest
        const yrs = Math.round(registry.daysSincePublish / 365);
        parts.push(`Maintenance is stale (last publish ~${yrs} year${yrs !== 1 ? 's' : ''} ago, ${registry.releasesLastYear} releases/year). Consider migration if long-term support matters.`);
    }
    if (score.fit >= 25)
        parts.push('Good fit for this project.');
    else if (score.fit >= 15)
        parts.push('Acceptable fit — minor concerns.');
    return parts.join(' ');
}
function buildReviewReason(score, vulns, socket, registry) {
    const reasons = [];
    if (vulns.length > 0)
        reasons.push(`${vulns.length} vulnerabilit${vulns.length === 1 ? 'y' : 'ies'} found`);
    if (registry.daysSincePublish > 730 && registry.releasesLastYear === 0) {
        const yrs = Math.round(registry.daysSincePublish / 365);
        reasons.push(`no releases in ${yrs} year${yrs !== 1 ? 's' : ''} — verify project is still maintained`);
    }
    else if (score.maintenance < 15) {
        reasons.push('low maintenance activity');
    }
    if (score.fit < 15)
        reasons.push('potential duplicate or layer conflict');
    if (socket.telemetry)
        reasons.push('package collects telemetry');
    if (socket.installScripts)
        reasons.push('runs install scripts');
    return reasons.length > 0 ? `Review required: ${reasons.join(', ')}.` : 'Score below adoption threshold — review before installing.';
}
function buildRejectReason(score, vulns, registry) {
    const reasons = [];
    if (vulns.some(v => v.severity === 'high'))
        reasons.push('high-severity vulnerabilities');
    if (score.maintenance === 0) {
        const yrs = Math.round(registry.daysSincePublish / 365);
        reasons.push(`no releases in ${yrs}+ year${yrs !== 1 ? 's' : ''}`);
    }
    if (score.fit === 0)
        reasons.push('layer violation and duplicate detected');
    return reasons.length > 0 ? `Not recommended: ${reasons.join(', ')}.` : 'Score too low for adoption.';
}
//# sourceMappingURL=scorer.js.map