"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRegistry = fetchRegistry;
const https_1 = __importDefault(require("https"));
const cache_js_1 = require("./cache.js");
const RANGE_RE = /[<>^~*]|\|\|/;
// Parse "x.y.z[-prerelease]" into [major, minor, patch]
function parseSemver(v) {
    const [maj, min, pat] = v.replace(/-.*$/, '').split('.').map(Number);
    return [maj ?? 0, min ?? 0, pat ?? 0];
}
function semverCmp(a, b) {
    const [a0, a1, a2] = parseSemver(a);
    const [b0, b1, b2] = parseSemver(b);
    return a0 !== b0 ? a0 - b0 : a1 !== b1 ? a1 - b1 : a2 - b2;
}
// Minimal semver range matcher — handles the common forms developers actually type.
function matchesRange(version, range) {
    // Skip pre-release versions unless explicitly requested
    if (version.includes('-') && !range.includes(version))
        return false;
    const [major, minor, patch] = parseSemver(version);
    // Caret: ^1.2.3 → >=1.2.3 <2.0.0 (or <0.3.0 for 0.x, <0.0.4 for 0.0.x)
    const caret = range.match(/^\^(\d+)\.(\d+)\.(\d+)/);
    if (caret) {
        const [, rMaj, rMin, rPat] = caret.map(Number);
        const [vM, vN, vP] = [major, minor, patch];
        if (rMaj > 0)
            return vM === rMaj && semverCmp(version, `${rMaj}.${rMin}.${rPat}`) >= 0;
        if (rMin > 0)
            return vM === 0 && vN === rMin && vP >= rPat;
        return vM === 0 && vN === 0 && vP === rPat;
    }
    // Tilde: ~1.2.3 → >=1.2.3 <1.3.0
    const tilde = range.match(/^~(\d+)\.(\d+)\.(\d+)/);
    if (tilde) {
        const [, rMaj, rMin, rPat] = tilde.map(Number);
        return major === rMaj && minor === rMin && patch >= rPat;
    }
    // Tilde with major.minor only: ~1.2 → >=1.2.0 <1.3.0
    const tildeMM = range.match(/^~(\d+)\.(\d+)$/);
    if (tildeMM) {
        const [, rMaj, rMin] = tildeMM.map(Number);
        return major === rMaj && minor === rMin;
    }
    // Range with comparators: >=1.2.3, <=1.2.5, >1.0.0, <2.0.0
    // Also handles compound: ">=1.2.3 <=1.2.5"
    const parts = range.split(/\s+/);
    return parts.every(part => {
        const m = part.match(/^(>=|<=|>|<|=)(\d+\.\d+\.\d+|\d+\.\d+|\d+)$/);
        if (!m)
            return true; // skip unknown
        const op = m[1];
        const cmp = semverCmp(version, m[2].includes('.') ? m[2] : `${m[2]}.0.0`);
        if (op === '>=')
            return cmp >= 0;
        if (op === '<=')
            return cmp <= 0;
        if (op === '>')
            return cmp > 0;
        if (op === '<')
            return cmp < 0;
        if (op === '=')
            return cmp === 0;
        return true;
    });
}
// Find the highest version from a list that satisfies the given range.
function resolveRange(allVersions, range) {
    return allVersions
        .filter(v => matchesRange(v, range))
        .sort(semverCmp)
        .at(-1);
}
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https_1.default.get(url, { headers: { 'User-Agent': 'arcguard-dep-check/1.0' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                const loc = res.headers.location;
                if (loc) {
                    resolve(httpsGet(loc));
                    return;
                }
            }
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
}
async function fetchDownloads(name) {
    try {
        const url = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`;
        const body = await httpsGet(url);
        const data = JSON.parse(body);
        return data.downloads ?? 0;
    }
    catch {
        return 0;
    }
}
async function fetchRegistry(name, version) {
    const cacheKey = `${name}@${version ?? 'latest'}`;
    const cached = cache_js_1.registryCache.get(cacheKey);
    if (cached)
        return cached;
    const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
    const body = await httpsGet(url);
    const pkg = JSON.parse(body);
    const distTags = pkg['dist-tags'] ?? {};
    const versions = pkg['versions'] ?? {};
    const allVersionKeys = Object.keys(versions);
    // Resolve semver ranges to a concrete version using the full version list from the registry
    let resolvedVer;
    if (!version) {
        resolvedVer = distTags['latest'] ?? allVersionKeys.at(-1) ?? 'unknown';
    }
    else if (RANGE_RE.test(version)) {
        resolvedVer = resolveRange(allVersionKeys, version) ?? distTags['latest'] ?? 'unknown';
    }
    else {
        resolvedVer = version;
    }
    const versionMeta = versions[resolvedVer] ?? {};
    const time = pkg['time'] ?? {};
    const lastPublishDate = time[resolvedVer] ?? time['modified'] ?? '';
    const daysSince = lastPublishDate
        ? Math.floor((Date.now() - new Date(lastPublishDate).getTime()) / 86400000)
        : 9999;
    const weeklyDownloads = await fetchDownloads(name);
    const latestVersion = distTags['latest'] ?? resolvedVer;
    const repoUrl = (() => {
        const repo = pkg['repository'];
        const raw = typeof repo === 'string' ? repo : repo?.url ?? '';
        return raw.replace(/^git\+/, '').replace(/\.git$/, '').replace('git://', 'https://').replace('git@github.com:', 'https://github.com/');
    })();
    const changelogUrl = repoUrl.includes('github.com')
        ? `${repoUrl}/releases`
        : versionMeta['homepage'] ?? pkg['homepage'] ?? '';
    // Count releases published in the last 12 months
    const oneYearAgo = Date.now() - 365 * 86400000;
    const releasesLastYear = Object.values(time).filter(d => {
        const t = new Date(d).getTime();
        return !isNaN(t) && t > oneYearAgo;
    }).length;
    const result = {
        name,
        version: resolvedVer,
        latestVersion,
        description: versionMeta['description'] ?? pkg['description'] ?? '',
        license: versionMeta['license'] ?? pkg['license'] ?? 'UNKNOWN',
        deprecated: versionMeta['deprecated'] ?? null,
        lastPublish: lastPublishDate,
        daysSincePublish: daysSince,
        weeklyDownloads,
        maintainerCount: (pkg['maintainers'] ?? []).length,
        releasesLastYear,
        homepage: versionMeta['homepage'] ?? pkg['homepage'] ?? '',
        repoUrl,
        changelogUrl,
    };
    cache_js_1.registryCache.set(cacheKey, result);
    return result;
}
//# sourceMappingURL=registry.js.map