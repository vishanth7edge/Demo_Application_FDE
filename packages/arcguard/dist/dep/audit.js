"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAudit = runAudit;
exports.runFullAudit = runFullAudit;
const child_process_1 = require("child_process");
const cache_js_1 = require("./cache.js");
function runAudit(packageName, projectRoot) {
    const cacheKey = `${packageName}::${projectRoot}`;
    const cached = cache_js_1.auditCache.get(cacheKey);
    if (cached)
        return cached;
    let raw = {};
    try {
        const output = (0, child_process_1.execSync)('npm audit --json', {
            cwd: projectRoot,
            encoding: 'utf8',
            timeout: 30000,
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        raw = JSON.parse(output);
    }
    catch (err) {
        // npm audit exits non-zero when vulnerabilities exist — parse stdout anyway
        const stdout = err.stdout ?? '';
        if (stdout) {
            try {
                raw = JSON.parse(stdout);
            }
            catch { /* no audit data */ }
        }
    }
    const vulns = [];
    const severities = new Set(['low', 'moderate', 'high', 'critical']);
    for (const [, vuln] of Object.entries(raw.vulnerabilities ?? {})) {
        if (vuln.name !== packageName)
            continue;
        if (!severities.has(vuln.severity ?? ''))
            continue;
        vulns.push({
            id: vuln.url?.split('/').pop() ?? 'unknown',
            severity: vuln.severity,
            cvssScore: null,
            title: vuln.title ?? 'Unknown vulnerability',
            url: vuln.url ?? '',
            range: vuln.range ?? '*',
        });
    }
    cache_js_1.auditCache.set(cacheKey, vulns);
    return vulns;
}
function runFullAudit(projectRoot) {
    let raw = {};
    try {
        const output = (0, child_process_1.execSync)('npm audit --json', {
            cwd: projectRoot,
            encoding: 'utf8',
            timeout: 30000,
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        raw = JSON.parse(output);
    }
    catch (err) {
        const stdout = err.stdout ?? '';
        if (stdout) {
            try {
                raw = JSON.parse(stdout);
            }
            catch { /* no data */ }
        }
    }
    const result = {};
    const severities = new Set(['low', 'moderate', 'high', 'critical']);
    for (const [, vuln] of Object.entries(raw.vulnerabilities ?? {})) {
        if (!vuln.name || !severities.has(vuln.severity ?? ''))
            continue;
        if (!result[vuln.name])
            result[vuln.name] = [];
        result[vuln.name].push({
            id: vuln.url?.split('/').pop() ?? 'unknown',
            severity: vuln.severity,
            cvssScore: null,
            title: vuln.title ?? 'Unknown vulnerability',
            url: vuln.url ?? '',
            range: vuln.range ?? '*',
        });
    }
    return result;
}
//# sourceMappingURL=audit.js.map