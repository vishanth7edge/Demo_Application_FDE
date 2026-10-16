"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchBundleStats = fetchBundleStats;
const https_1 = __importDefault(require("https"));
const cache_js_1 = require("./cache.js");
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
async function fetchBundleStats(name, version) {
    const cacheKey = `${name}@${version ?? 'latest'}`;
    const cached = cache_js_1.bundleCache.get(cacheKey);
    if (cached)
        return cached;
    const pkg = version ? `${name}@${version}` : name;
    const url = `https://bundlephobia.com/api/size?package=${encodeURIComponent(pkg)}&record=true`;
    try {
        const body = await httpsGet(url);
        const data = JSON.parse(body);
        const result = {
            available: true,
            gzip: typeof data.gzip === 'number' ? data.gzip : 0,
            raw: typeof data.size === 'number' ? data.size : 0,
            treeshakeable: data.hasJSModule || data.hasJSNext || false,
            dependencyCount: typeof data.dependencyCount === 'number' ? data.dependencyCount : 0,
        };
        cache_js_1.bundleCache.set(cacheKey, result);
        return result;
    }
    catch {
        return { available: false, gzip: 0, raw: 0, treeshakeable: false, dependencyCount: 0 };
    }
}
//# sourceMappingURL=bundlephobia.js.map