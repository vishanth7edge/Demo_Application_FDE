"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchVulns = fetchVulns;
const https_1 = __importDefault(require("https"));
const cache_js_1 = require("./cache.js");
// OSV (Open Source Vulnerabilities) API — free, no auth, covers npm
// https://osv.dev/docs/
const OSV_URL = 'https://api.osv.dev/v1/query';
function post(body) {
    return new Promise((resolve, reject) => {
        const req = https_1.default.request({ hostname: 'api.osv.dev', path: '/v1/query', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
            let data = '';
            res.on('data', (c) => { data += c; });
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
// Parse CVSS v3 vector to approximate numeric base score and severity band.
function cvssVectorToScore(vector) {
    const metrics = {};
    vector.replace(/^CVSS:\d+\.\d+\//, '').split('/').forEach(part => {
        const [k, v] = part.split(':');
        if (k && v)
            metrics[k] = v;
    });
    // Numeric approximation using CVSS v3 base score formula weight table
    const AV = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
    const AC = { L: 0.77, H: 0.44 };
    const PR = { N: 0.85, L: 0.62, H: 0.27 };
    const UI = { N: 0.85, R: 0.62 };
    const CIA = { N: 0, L: 0.22, H: 0.56 };
    const av = AV[metrics['AV']] ?? 0.85;
    const ac = AC[metrics['AC']] ?? 0.77;
    const pr = PR[metrics['PR']] ?? 0.85;
    const ui = UI[metrics['UI']] ?? 0.85;
    const c = CIA[metrics['C']] ?? 0;
    const i = CIA[metrics['I']] ?? 0;
    const a = CIA[metrics['A']] ?? 0;
    const iss = 1 - (1 - c) * (1 - i) * (1 - a);
    if (iss === 0)
        return { score: 0, severity: 'low' };
    const scope = metrics['S'] === 'C';
    const impact = scope ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15) : 6.42 * iss;
    const exploit = 8.22 * av * ac * pr * ui;
    let raw = impact <= 0 ? 0 : scope ? Math.min(10, 1.08 * (impact + exploit)) : Math.min(10, impact + exploit);
    raw = Math.round(raw * 10) / 10;
    const severity = raw >= 9.0 ? 'critical' : raw >= 7.0 ? 'high' : raw >= 4.0 ? 'moderate' : 'low';
    return { score: raw, severity };
}
function mapSeverityAndScore(vuln) {
    const cvssEntry = vuln.severity?.find(s => s.type === 'CVSS_V3') ?? vuln.severity?.[0];
    let cvssScore = null;
    let severityFromVector = null;
    if (cvssEntry?.score) {
        const parsed = cvssVectorToScore(cvssEntry.score);
        cvssScore = parsed.score;
        severityFromVector = parsed.severity;
    }
    const db = vuln.database_specific?.severity?.toUpperCase();
    if (db === 'CRITICAL')
        return { severity: 'critical', cvssScore };
    if (db === 'HIGH')
        return { severity: 'high', cvssScore };
    if (db === 'MODERATE' || db === 'MEDIUM')
        return { severity: 'moderate', cvssScore };
    if (db === 'LOW')
        return { severity: 'low', cvssScore };
    if (severityFromVector)
        return { severity: severityFromVector, cvssScore };
    return { severity: 'moderate', cvssScore };
}
function getAdvisoryUrl(vuln) {
    const ghsa = vuln.id.startsWith('GHSA-') ? vuln.id : vuln.aliases?.find(a => a.startsWith('GHSA-'));
    if (ghsa)
        return `https://github.com/advisories/${ghsa}`;
    const cve = vuln.aliases?.find(a => a.startsWith('CVE-'));
    if (cve)
        return `https://nvd.nist.gov/vuln/detail/${cve}`;
    return `https://osv.dev/vulnerability/${vuln.id}`;
}
function getAffectedRange(vuln) {
    const ranges = vuln.affected?.[0]?.ranges ?? [];
    const parts = [];
    for (const r of ranges) {
        if (r.type !== 'SEMVER')
            continue;
        let intro = '';
        let fixed = '';
        for (const ev of r.events) {
            if (ev.introduced && ev.introduced !== '0')
                intro = `>=${ev.introduced}`;
            if (ev.fixed)
                fixed = `<${ev.fixed}`;
        }
        if (intro || fixed)
            parts.push([intro, fixed].filter(Boolean).join(' '));
    }
    return parts.join(', ') || '*';
}
async function fetchVulns(name, version) {
    const cacheKey = `osv:${name}@${version}`;
    const cached = cache_js_1.registryCache.get(cacheKey);
    if (cached)
        return cached;
    try {
        const body = JSON.stringify({ package: { name, ecosystem: 'npm' }, version });
        const raw = await post(body);
        const resp = JSON.parse(raw);
        const result = (resp.vulns ?? []).map(vuln => {
            const { severity, cvssScore } = mapSeverityAndScore(vuln);
            return {
                id: vuln.aliases?.find(a => a.startsWith('CVE-')) ?? vuln.id,
                ghsa: vuln.id.startsWith('GHSA-') ? vuln.id : (vuln.aliases?.find(a => a.startsWith('GHSA-')) ?? ''),
                severity,
                cvssScore,
                title: vuln.summary ?? 'Unknown vulnerability',
                url: getAdvisoryUrl(vuln),
                range: getAffectedRange(vuln),
            };
        });
        cache_js_1.registryCache.set(cacheKey, result);
        return result;
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=osv.js.map