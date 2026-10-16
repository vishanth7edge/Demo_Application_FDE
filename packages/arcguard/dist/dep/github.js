"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGitHubStats = fetchGitHubStats;
const https_1 = __importDefault(require("https"));
const cache_js_1 = require("./cache.js");
function extractGitHubOwnerRepo(repoUrl) {
    const m = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!m)
        return null;
    return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}
function httpsGet(url, token) {
    return new Promise((resolve, reject) => {
        const headers = {
            'User-Agent': 'arcguard-dep-check/1.0',
            'Accept': 'application/vnd.github+json',
        };
        if (token)
            headers['Authorization'] = `Bearer ${token}`;
        https_1.default.get(url, { headers }, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
}
async function fetchGitHubStats(repoUrl) {
    const parsed = extractGitHubOwnerRepo(repoUrl);
    if (!parsed)
        return { available: false, daysSinceLastCommit: null, openIssues: null, stars: null };
    const cacheKey = `github:${parsed.owner}/${parsed.repo}`;
    const cached = cache_js_1.registryCache.get(cacheKey);
    if (cached)
        return cached;
    const token = process.env['GITHUB_TOKEN'];
    const apiBase = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
    try {
        const [repoBody, commitsBody] = await Promise.all([
            httpsGet(apiBase, token),
            httpsGet(`${apiBase}/commits?per_page=1`, token),
        ]);
        const repoData = JSON.parse(repoBody);
        // GitHub returns { message: "Not Found" } or rate limit message on failure
        if (repoData.message) {
            const result = { available: false, daysSinceLastCommit: null, openIssues: null, stars: null };
            cache_js_1.registryCache.set(cacheKey, result);
            return result;
        }
        let daysSinceLastCommit = null;
        try {
            const commits = JSON.parse(commitsBody);
            if (commits[0]?.commit?.committer?.date) {
                const ms = Date.now() - new Date(commits[0].commit.committer.date).getTime();
                daysSinceLastCommit = Math.floor(ms / 86400000);
            }
        }
        catch { /* ignore */ }
        const result = {
            available: true,
            daysSinceLastCommit,
            openIssues: repoData.open_issues_count ?? null,
            stars: repoData.stargazers_count ?? null,
        };
        cache_js_1.registryCache.set(cacheKey, result);
        return result;
    }
    catch {
        return { available: false, daysSinceLastCommit: null, openIssues: null, stars: null };
    }
}
//# sourceMappingURL=github.js.map