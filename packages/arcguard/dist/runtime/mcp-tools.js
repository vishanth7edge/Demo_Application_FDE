"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RUNTIME_TOOL_DEFS = void 0;
exports.handleGetConsoleErrors = handleGetConsoleErrors;
exports.handleGetNetworkRequests = handleGetNetworkRequests;
exports.handleGetRuntimeSnapshot = handleGetRuntimeSnapshot;
exports.handleClearRuntimeStore = handleClearRuntimeStore;
exports.handleGetGitChanges = handleGetGitChanges;
exports.handleGetElementInfo = handleGetElementInfo;
exports.handleGetHAR = handleGetHAR;
exports.handleGenerateRegressionTest = handleGenerateRegressionTest;
exports.handleGetPerformanceReport = handleGetPerformanceReport;
exports.handleGetRoutesPerformance = handleGetRoutesPerformance;
exports.handleCheckDependency = handleCheckDependency;
exports.handleAuditDependencies = handleAuditDependencies;
exports.handleFindDuplicatePackages = handleFindDuplicatePackages;
exports.handleGetActionTimeline = handleGetActionTimeline;
const http_1 = __importDefault(require("http"));
const server_js_1 = require("./server.js");
const index_js_1 = require("../dep/index.js");
function fetchJson(port, path) {
    return new Promise((resolve, reject) => {
        http_1.default.get(`http://127.0.0.1:${port}${path}`, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                }
                catch (e) {
                    reject(new Error(`JSON parse failed: ${e}`));
                }
            });
        }).on('error', reject);
    });
}
function postJson(port, path) {
    return new Promise((resolve, reject) => {
        const req = http_1.default.request({ hostname: '127.0.0.1', port, path, method: 'POST', headers: { 'Content-Length': '0' } }, () => resolve());
        req.on('error', reject);
        req.end();
    });
}
async function handleGetConsoleErrors(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        const snap = await fetchJson(port, '/__arcguard/snapshot');
        let events = snap.consoleEvents;
        if (args.type)
            events = events.filter(e => e.type === args.type);
        if (args.sinceId)
            events = events.filter(e => e.id > (args.sinceId ?? 0));
        if (args.limit)
            events = events.slice(-args.limit);
        return {
            pageUrl: snap.pageUrl,
            capturedAt: snap.capturedAt,
            total: snap.consoleEvents.length,
            errorCount: snap.errorCount,
            events,
        };
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
async function handleGetNetworkRequests(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        const snap = await fetchJson(port, '/__arcguard/snapshot');
        let events = snap.networkEvents;
        if (args.method)
            events = events.filter(e => e.method === args.method.toUpperCase());
        if (args.statusMin)
            events = events.filter(e => e.status >= (args.statusMin ?? 0));
        if (args.sinceId)
            events = events.filter(e => e.id > (args.sinceId ?? 0));
        if (args.limit)
            events = events.slice(-args.limit);
        return {
            pageUrl: snap.pageUrl,
            capturedAt: snap.capturedAt,
            total: snap.networkEvents.length,
            failedRequestCount: snap.failedRequestCount,
            events,
        };
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
async function handleGetRuntimeSnapshot(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        return await fetchJson(port, '/__arcguard/snapshot');
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
async function handleClearRuntimeStore(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        await postJson(port, '/__arcguard/clear');
        return { ok: true, message: 'Runtime store cleared.' };
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}.` };
    }
}
async function handleGetGitChanges(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        return await fetchJson(port, '/__arcguard/git');
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
async function handleGetElementInfo(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        return await fetchJson(port, '/__arcguard/element');
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
async function handleGetHAR(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        return await fetchJson(port, '/__arcguard/har');
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
async function handleGenerateRegressionTest(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        const snap = await fetchJson(port, '/__arcguard/snapshot');
        const errors = snap.consoleEvents
            .filter(e => e.type === 'error' || e.type === 'warn').slice(-8);
        const netFails = snap.networkEvents
            .filter(e => e.status >= 400 || e.status === 0).slice(-8);
        const context = [
            '## Bug Context (captured by ArchGuard)',
            `**Page:** ${snap.pageUrl}`,
            errors.length ? '\n### Console Errors\n' + errors.map(e => `- [${e.type.toUpperCase()}] ${e.message}${e.stack ? '\n  ' + e.stack.split('\n')[1] : ''}`).join('\n') : '',
            netFails.length ? '\n### Failed Requests\n' + netFails.map(e => `- ${e.method} ${e.url} → ${e.status}${e.responseBody ? ' | ' + e.responseBody.slice(0, 200) : ''}`).join('\n') : '',
        ].filter(Boolean).join('\n');
        return {
            ok: true,
            message: `Context collected from runtime. POST to http://127.0.0.1:${port}/__arcguard/generate-test with { context } to stream the generated test, or use the Export tab in the widget.`,
            context,
            errorCount: errors.length,
            failedRequestCount: netFails.length,
        };
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
async function handleGetPerformanceReport(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        return await fetchJson(port, '/__arcguard/perf');
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
async function handleGetRoutesPerformance(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        const routes = await fetchJson(port, '/__arcguard/perf/routes');
        const entries = Object.values(routes);
        const summary = {
            totalRoutes: entries.length,
            worstRoutes: entries.sort((a, b) => (a.score ?? 100) - (b.score ?? 100)).slice(0, 5).map(r => ({
                path: r.path,
                score: r.score,
                lcp: r.lcp,
                cls: r.cls,
                apiCalls: r.apiCalls,
                apiErrors: r.apiErrors,
                longTasks: r.longTasks,
                loadType: r.loadType,
            })),
            routes,
        };
        return summary;
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
async function handleCheckDependency(args) {
    const pkg = args.packageName;
    if (!pkg)
        return { error: 'packageName is required' };
    const root = args.projectRoot ?? process.cwd();
    try {
        return await (0, index_js_1.checkPackage)(pkg, root);
    }
    catch (err) {
        return { error: String(err) };
    }
}
async function handleAuditDependencies(args) {
    const root = args.projectRoot ?? process.cwd();
    const limit = args.limit ?? 10;
    try {
        const reports = await (0, index_js_1.auditAllDeps)(root, limit);
        const filtered = args.severity
            ? reports.filter(r => {
                if (args.severity === 'critical')
                    return r.vulnerabilities.some(v => v.severity === 'critical');
                if (args.severity === 'high')
                    return r.vulnerabilities.some(v => v.severity === 'high' || v.severity === 'critical');
                return true;
            })
            : reports;
        return {
            total: filtered.length,
            rejectCount: filtered.filter(r => r.verdict === 'REJECT').length,
            reviewCount: filtered.filter(r => r.verdict === 'REVIEW').length,
            packages: filtered,
        };
    }
    catch (err) {
        return { error: String(err) };
    }
}
async function handleFindDuplicatePackages(args) {
    const root = args.projectRoot ?? process.cwd();
    try {
        const duplicates = (0, index_js_1.findAllDuplicates)(root);
        return {
            duplicateCategories: duplicates.length,
            duplicates,
            summary: duplicates.map(d => `${d.category}: ${d.packages.map(p => p.name).join(', ')}`),
        };
    }
    catch (err) {
        return { error: String(err) };
    }
}
async function handleGetActionTimeline(args) {
    const port = args.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    try {
        const actions = await fetchJson(port, '/__arcguard/actions');
        return args.limit ? actions.slice(-args.limit) : actions;
    }
    catch {
        return { error: `ArchGuard runtime server not reachable on port ${port}. Is \`arcguard dev\` running?` };
    }
}
const PORT_PROP = {
    port: { type: 'number', description: `Port the arcguard runtime server is listening on (default: ${server_js_1.DEFAULT_RUNTIME_PORT})` },
};
exports.RUNTIME_TOOL_DEFS = [
    {
        name: 'get_routes_performance',
        description: 'Returns real-browser performance metrics for every route the developer visited during the current session — LCP, CLS, FCP, TTFB, API call counts, error counts, long-task counts, load type (full-page or SPA navigation), and a computed score (0–100). Unlike Lighthouse, these metrics come from the actual browser with real auth, real data, and real cache. The worstRoutes field surfaces the bottom 5 routes by score. Use this to identify which pages need the most attention site-wide.',
        inputSchema: {
            type: 'object',
            properties: { ...PORT_PROP },
        },
    },
    {
        name: 'get_performance_report',
        description: 'Returns the latest performance diagnostics snapshot collected from the browser by the ArchGuard widget — including Web Vitals (LCP, CLS, INP, FCP), page load timing (TTFB, DNS, DOMReady), API call analysis (sequential request chains, slowest requests, repeated URLs), long tasks (> 50 ms), and large assets. Requires the developer to open the Perf tab in the widget and click "Send to Claude" first.',
        inputSchema: {
            type: 'object',
            properties: { ...PORT_PROP },
        },
    },
    {
        name: 'generate_regression_test',
        description: 'Collects the current runtime bug context (console errors, failed network requests, action timeline) and triggers the ArchGuard server to generate a regression test via the Claude CLI. The test is written to disk and streamed back. Use this immediately after fixing a bug to lock in the fix with a test.',
        inputSchema: {
            type: 'object',
            properties: {
                ...PORT_PROP,
                framework: { type: 'string', enum: ['Vitest', 'Jest', 'Playwright', 'Cypress'], description: 'Override auto-detected test framework' },
            },
        },
    },
    {
        name: 'get_har',
        description: 'Returns the full HTTP Archive (HAR) of all network requests captured by the ArchGuard widget — including headers, request/response bodies, status codes, and timing. Standard HAR 1.2 format compatible with Chrome DevTools, Insomnia, and Postman.',
        inputSchema: {
            type: 'object',
            properties: { ...PORT_PROP },
        },
    },
    {
        name: 'get_git_changes',
        description: 'Returns recent git commits, changed file stats, and a diff of the working tree from the project root. Useful for correlating bugs with recent code changes.',
        inputSchema: {
            type: 'object',
            properties: { ...PORT_PROP },
        },
    },
    {
        name: 'get_element_info',
        description: 'Returns information about the last DOM element the developer inspected using the ArchGuard widget Element Inspector — including tag, component name, source file, props, and ancestor path.',
        inputSchema: {
            type: 'object',
            properties: { ...PORT_PROP },
        },
    },
    {
        name: 'get_action_timeline',
        description: 'Returns the recorded sequence of user actions (clicks, inputs, navigations) captured by the ArchGuard widget recorder. Use this to understand the exact steps that led to a bug.',
        inputSchema: {
            type: 'object',
            properties: {
                ...PORT_PROP,
                limit: { type: 'number', description: 'Return only the N most recent actions' },
            },
        },
    },
    {
        name: 'check_dependency',
        description: 'Evaluate an npm package before installing it. Returns a full report including: security score (vulnerabilities from npm audit, supply-chain flags from socket.dev), maintenance score (last publish date, weekly downloads, deprecation status), and project fit score (detects if you already have a package that does the same thing, checks for architecture layer violations, validates the license). Returns a clear ADOPT / REVIEW / REJECT verdict with the reason.',
        inputSchema: {
            type: 'object',
            required: ['packageName'],
            properties: {
                packageName: { type: 'string', description: 'Package name with optional version: "got" or "got@14.0.0"' },
                projectRoot: { type: 'string', description: 'Absolute path to the project root (defaults to server working directory)' },
            },
        },
    },
    {
        name: 'audit_dependencies',
        description: 'Scan all production dependencies in package.json and return the worst offenders ranked by score ascending (worst first). Useful during PR review to spot newly introduced risky packages, or when a developer asks "what is the health of our dependencies?"',
        inputSchema: {
            type: 'object',
            properties: {
                projectRoot: { type: 'string', description: 'Absolute path to the project root (defaults to server working directory)' },
                limit: { type: 'number', description: 'Return only the N worst packages (default 10)' },
                severity: { type: 'string', enum: ['all', 'high', 'critical'], description: 'Filter to packages with vulnerabilities at this severity or above' },
            },
        },
    },
    {
        name: 'find_duplicate_packages',
        description: 'Scan all installed packages, group by functional category (HTTP client, date library, validation, state manager, etc.), and return any categories where more than one package is present. Use this to identify consolidation opportunities — e.g. "you have both axios and got, both are HTTP clients."',
        inputSchema: {
            type: 'object',
            properties: {
                projectRoot: { type: 'string', description: 'Absolute path to the project root (defaults to server working directory)' },
            },
        },
    },
    {
        name: 'get_console_errors',
        description: 'Returns console errors and warnings captured from the browser by the ArchGuard runtime widget. Requires `arcguard dev` to be running and the widget injected into the page.',
        inputSchema: {
            type: 'object',
            properties: {
                ...PORT_PROP,
                type: { type: 'string', enum: ['error', 'warn', 'log', 'info'], description: 'Filter by console event type' },
                limit: { type: 'number', description: 'Return only the N most recent events' },
                sinceId: { type: 'number', description: 'Return only events with id > sinceId (for polling)' },
            },
        },
    },
    {
        name: 'get_network_requests',
        description: 'Returns network requests (fetch / XHR) captured from the browser by the ArchGuard runtime widget. Requires `arcguard dev` to be running.',
        inputSchema: {
            type: 'object',
            properties: {
                ...PORT_PROP,
                method: { type: 'string', description: 'Filter by HTTP method (GET, POST, …)' },
                statusMin: { type: 'number', description: 'Return only requests with status >= this value (e.g. 400 for errors)' },
                limit: { type: 'number', description: 'Return only the N most recent requests' },
                sinceId: { type: 'number', description: 'Return only requests with id > sinceId (for polling)' },
            },
        },
    },
    {
        name: 'get_runtime_snapshot',
        description: 'Returns a full snapshot of all captured console events, network requests, error counts, and the current page URL from the ArchGuard runtime widget.',
        inputSchema: {
            type: 'object',
            properties: { ...PORT_PROP },
        },
    },
    {
        name: 'clear_runtime_store',
        description: 'Clears all captured console and network events from the ArchGuard runtime server in-memory store.',
        inputSchema: {
            type: 'object',
            properties: { ...PORT_PROP },
        },
    },
];
//# sourceMappingURL=mcp-tools.js.map