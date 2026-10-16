"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSocketScore = fetchSocketScore;
const https_1 = __importDefault(require("https"));
const cache_js_1 = require("./cache.js");
function httpsGet(url, apiKey) {
    return new Promise((resolve, reject) => {
        const opts = {
            headers: {
                'User-Agent': 'arcguard-dep-check/1.0',
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
        };
        https_1.default.get(url, opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
}
async function fetchSocketScore(name) {
    const cached = cache_js_1.socketCache.get(name);
    if (cached)
        return cached;
    const apiKey = process.env['SOCKET_API_KEY'];
    const url = `https://api.socket.dev/v0/npm/${encodeURIComponent(name)}/score`;
    try {
        const body = await httpsGet(url, apiKey);
        const data = JSON.parse(body);
        const alerts = data.alerts ?? [];
        const alertTypes = new Set(alerts.map((a) => a.type));
        const result = {
            available: true,
            malware: alertTypes.has('malware'),
            installScripts: alertTypes.has('installScripts'),
            obfuscatedCode: alertTypes.has('obfuscatedCode'),
            protestware: alertTypes.has('protestware'),
            telemetry: alertTypes.has('telemetry'),
            score: typeof data.score === 'number' ? data.score : 1,
        };
        cache_js_1.socketCache.set(name, result);
        return result;
    }
    catch {
        return {
            available: false,
            malware: false,
            installScripts: false,
            obfuscatedCode: false,
            protestware: false,
            telemetry: false,
            score: 1,
        };
    }
}
//# sourceMappingURL=socket.js.map