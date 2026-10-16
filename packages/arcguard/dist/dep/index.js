"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllDuplicates = void 0;
exports.checkPackage = checkPackage;
exports.auditAllDeps = auditAllDeps;
const registry_js_1 = require("./registry.js");
const osv_js_1 = require("./osv.js");
const socket_js_1 = require("./socket.js");
const bundlephobia_js_1 = require("./bundlephobia.js");
const github_js_1 = require("./github.js");
const analyzer_js_1 = require("./analyzer.js");
const scorer_js_1 = require("./scorer.js");
function computeUpdateType(installed, latest) {
    if (!installed)
        return 'unknown';
    const clean = (v) => v.replace(/^[^0-9]*/, ''); // strip ^~>=
    const [iMaj, iMin] = clean(installed).split('.').map(Number);
    const [lMaj, lMin] = latest.split('.').map(Number);
    if (isNaN(iMaj) || isNaN(lMaj))
        return 'unknown';
    if (lMaj > iMaj)
        return 'major';
    if (lMaj === iMaj && lMin > iMin)
        return 'minor';
    if (latest !== clean(installed))
        return 'patch';
    return 'none';
}
var analyzer_js_2 = require("./analyzer.js");
Object.defineProperty(exports, "findAllDuplicates", { enumerable: true, get: function () { return analyzer_js_2.findAllDuplicates; } });
// Parse "got@14.0.0" → { name: 'got', version: '14.0.0' }
function parsePkgArg(arg) {
    const atIdx = arg.lastIndexOf('@');
    if (atIdx > 0) {
        return { name: arg.slice(0, atIdx), version: arg.slice(atIdx + 1) };
    }
    return { name: arg, version: undefined };
}
async function checkPackage(packageArg, projectRoot) {
    const { name, version } = parsePkgArg(packageArg);
    // Fetch registry + socket + bundle in parallel
    const [registry, socket, bundle] = await Promise.all([
        (0, registry_js_1.fetchRegistry)(name, version),
        (0, socket_js_1.fetchSocketScore)(name),
        (0, bundlephobia_js_1.fetchBundleStats)(name, version),
    ]);
    // Project-aware analysis (gives us installedVersion from node_modules)
    const project = (0, analyzer_js_1.analyzeProject)(name, registry.license, projectRoot);
    // Check vulns for the exact installed version, then also for latest
    // so we can tell the user whether upgrading would fix the issue.
    const checkedVersion = project.installedVersion ?? registry.version;
    const [vulnerabilities, latestVulnerabilities, github] = await Promise.all([
        (0, osv_js_1.fetchVulns)(name, checkedVersion),
        registry.latestVersion !== checkedVersion
            ? (0, osv_js_1.fetchVulns)(name, registry.latestVersion)
            : Promise.resolve([]),
        (0, github_js_1.fetchGitHubStats)(registry.repoUrl),
    ]);
    // Score is based on the installed version's vulns + all maintenance signals
    const score = (0, scorer_js_1.computeScore)(vulnerabilities, socket, registry, project, github);
    const { verdict, reason } = (0, scorer_js_1.computeVerdict)(score, vulnerabilities, socket, registry);
    const updateType = computeUpdateType(project.installedVersion ?? project.currentVersion, registry.latestVersion);
    const vulnPriority = vulnerabilities.length === 0
        ? undefined
        : project.usageFiles.length > 0
            ? 'used+vulnerable'
            : project.alreadyInstalled
                ? 'installed+vulnerable'
                : 'transitive+vulnerable';
    return {
        name,
        resolvedVersion: checkedVersion,
        registry,
        vulnerabilities,
        latestVulnerabilities,
        socket,
        bundle,
        project,
        github,
        score,
        verdict,
        verdictReason: reason,
        updateType,
        vulnPriority,
    };
}
function readInstalledPackages(projectRoot, includeDev, includeTransitive) {
    const fs = require('fs');
    const path = require('path');
    const result = new Map();
    // Primary source: package-lock.json v2/v3 (flat packages map)
    try {
        const lock = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8'));
        if (lock.packages) {
            for (const [key, meta] of Object.entries(lock.packages)) {
                if (!key || key === '')
                    continue; // skip root entry
                if (!includeDev && meta.dev)
                    continue;
                const name = key.replace(/^node_modules\//, '').replace(/.*node_modules\//, '');
                if (!includeTransitive && !isDirectDep(name, projectRoot, includeDev))
                    continue;
                if (meta.version)
                    result.set(name, meta.version);
            }
            return result;
        }
    }
    catch { /* fall through */ }
    // Fallback: scan node_modules directly
    try {
        const nm = path.join(projectRoot, 'node_modules');
        const entries = fs.readdirSync(nm);
        for (const entry of entries) {
            if (entry.startsWith('.'))
                continue;
            const pkgPath = entry.startsWith('@')
                ? fs.readdirSync(path.join(nm, entry)).map(sub => `${entry}/${sub}`)
                : [entry];
            for (const p of pkgPath) {
                try {
                    const m = JSON.parse(fs.readFileSync(path.join(nm, p, 'package.json'), 'utf8'));
                    if (m.version)
                        result.set(p, m.version);
                }
                catch { /* skip */ }
            }
        }
    }
    catch { /* skip */ }
    return result;
}
function isDirectDep(name, projectRoot, includeDev) {
    try {
        const fs = require('fs');
        const path = require('path');
        const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
        const deps = { ...(pkg['dependencies'] ?? {}) };
        if (includeDev)
            Object.assign(deps, pkg['devDependencies'] ?? {});
        return name in deps;
    }
    catch {
        return false;
    }
}
async function auditAllDeps(projectRoot, limit = 10, opts = {}) {
    const packages = readInstalledPackages(projectRoot, opts.dev ?? false, opts.transitive ?? false);
    if (packages.size === 0)
        return [];
    const entries = Array.from(packages.entries()); // [name, version]
    const reports = [];
    // Batches of 5 to avoid overwhelming external APIs
    for (let i = 0; i < entries.length; i += 5) {
        const batch = entries.slice(i, i + 5);
        const results = await Promise.allSettled(batch.map(([pkg, ver]) => checkPackage(`${pkg}@${ver}`, projectRoot)));
        for (const r of results) {
            if (r.status === 'fulfilled')
                reports.push(r.value);
        }
    }
    reports.sort((a, b) => a.score.total - b.score.total);
    return limit > 0 ? reports.slice(0, limit) : reports;
}
//# sourceMappingURL=index.js.map