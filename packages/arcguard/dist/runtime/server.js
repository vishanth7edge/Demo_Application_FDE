"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RUNTIME_PORT = void 0;
exports.createRuntimeServer = createRuntimeServer;
const http_1 = __importDefault(require("http"));
const child_process_1 = require("child_process");
const index_js_1 = require("../dep/index.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage_js_1 = require("./storage.js");
const widget_script_js_1 = require("./widget-script.js");
exports.DEFAULT_RUNTIME_PORT = 7432;
function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function json(res, data, status = 200) {
    cors(res);
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}
function detectTestConventions(root) {
    // Detect framework from package.json
    let framework = 'Vitest';
    try {
        const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(root, 'package.json'), 'utf8'));
        const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
        if (deps['@playwright/test'] || deps['playwright'])
            framework = 'Playwright';
        else if (deps['cypress'])
            framework = 'Cypress';
        else if (deps['jest'] && !deps['vitest'])
            framework = 'Jest';
        else if (deps['vitest'])
            framework = 'Vitest';
    }
    catch { /* ignore */ }
    // Scan for existing test files to learn project conventions
    let existingFiles = [];
    try {
        const out = (0, child_process_1.execSync)('find . -type f \\( -name "*.spec.ts" -o -name "*.test.ts" -o -name "*.spec.tsx" -o -name "*.test.tsx" ' +
            '-o -name "*.spec.js" -o -name "*.test.js" -o -name "*.spec.cjs" -o -name "*.test.cjs" ' +
            '-o -name "*.cy.ts" -o -name "*.cy.js" \\) ' +
            '-not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" 2>/dev/null', { cwd: root, encoding: 'utf8', timeout: 8000 });
        existingFiles = out.trim().split('\n').filter(Boolean);
    }
    catch { /* ignore */ }
    // Pick the dominant file extension pattern
    const extCount = {};
    existingFiles.forEach(f => {
        const m = f.match(/(\.[^.]+\.[^.]+)$/); // .spec.ts, .test.cjs, etc.
        if (m)
            extCount[m[1]] = (extCount[m[1]] || 0) + 1;
    });
    const ext = existingFiles.length
        ? (Object.entries(extCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '.test.ts')
        : (framework === 'Playwright' ? '.spec.ts' : framework === 'Cypress' ? '.cy.ts' : '.test.ts');
    // Collect unique directories where tests live
    const testDirs = [...new Set(existingFiles.map(f => path_1.default.dirname(f).replace(/^\.\//, '')))];
    // Read first matching example as style reference
    let exampleFile = null;
    for (const f of existingFiles) {
        try {
            const abs = path_1.default.join(root, f.replace(/^\.\//, ''));
            const content = fs_1.default.readFileSync(abs, 'utf8').slice(0, 2000);
            exampleFile = { relPath: f.replace(/^\.\//, ''), content };
            break;
        }
        catch { /* try next */ }
    }
    return { framework, ext, testDirs, exampleFile };
}
function inferTestType(context) {
    const hasElement = context.includes('### Inspected Element');
    const hasActions = context.includes('### User Action Timeline');
    const hasNetFails = context.includes('### Failed Network Requests');
    if (hasNetFails && !hasActions && !hasElement)
        return 'api';
    if (hasElement && !hasActions)
        return 'component';
    return 'e2e';
}
function buildTestPrompt(conventions, bugContext) {
    const testType = inferTestType(bugContext);
    const typeGuide = {
        component: 'Write a COMPONENT test using the framework\'s component testing utilities (e.g. @testing-library/react render/screen/fireEvent). Import the component from its source path shown in "Inspected Element".',
        e2e: 'Write an END-TO-END test that drives the browser through the exact user action sequence shown in "User Action Timeline".',
        api: 'Write an API/integration test that calls the endpoints shown in "Failed Network Requests" and asserts the correct response.',
    };
    const frameworkHints = {
        Playwright: 'Use @playwright/test. Use page.goto / page.click / page.fill / expect. Mock network with page.route().',
        Cypress: 'Use Cypress. Use cy.visit / cy.get / cy.click / cy.intercept.',
        Vitest: 'Use vitest. Mock fetch/axios with vi.fn() or vi.spyOn(). Use @testing-library/react for component tests.',
        Jest: 'Use jest. Mock fetch/axios with jest.fn() or jest.spyOn(). Use @testing-library/react for component tests.',
    };
    const dirHint = conventions.testDirs.length
        ? `Place the file inside one of these existing test directories: ${conventions.testDirs.slice(0, 3).join(', ')}`
        : 'Place the file alongside the source file being tested.';
    const exampleSection = conventions.exampleFile
        ? `\n## Existing test style (follow this exactly)\nFile: ${conventions.exampleFile.relPath}\n\`\`\`\n${conventions.exampleFile.content}\n\`\`\``
        : '';
    return `You are writing a regression test for a bug that was just fixed.

Test type: ${testType.toUpperCase()}
Framework: ${conventions.framework}  |  File extension: ${conventions.ext}
${typeGuide[testType]}
${frameworkHints[conventions.framework] ?? ''}
${dirHint}
Do NOT create a new folder — use an existing test directory.
${exampleSection}

## Bug context
${bugContext}

## Instructions
1. Reproduce the exact scenario above as the test body
2. Add a comment: // REGRESSION: would fail before the fix
3. Must PASS after the fix, FAIL without it
4. No fixed timeouts — use waitFor / assertions
5. Mock any failed network requests shown above

Output ONLY the file content. No markdown fences. No explanation. Use TypeScript.
Begin:`;
}
function httpStatusText(status) {
    const map = {
        200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 302: 'Found',
        400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
        405: 'Method Not Allowed', 409: 'Conflict', 422: 'Unprocessable Entity',
        429: 'Too Many Requests', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
    };
    return map[status] ?? 'Unknown';
}
function generateHAR(pageUrl) {
    const events = storage_js_1.networkStore.all();
    return {
        log: {
            version: '1.2',
            creator: { name: 'ArchGuard', version: '0.1.0' },
            pages: [{
                    startedDateTime: new Date().toISOString(),
                    id: 'page_1',
                    title: pageUrl,
                    pageTimings: { onContentLoad: -1, onLoad: -1 },
                }],
            entries: events.map(ev => {
                const started = new Date(ev.timestamp - ev.duration).toISOString();
                const reqHeaders = Object.entries(ev.requestHeaders ?? {}).map(([name, value]) => ({ name, value }));
                const respHeaders = Object.entries(ev.responseHeaders ?? {}).map(([name, value]) => ({ name, value }));
                return {
                    startedDateTime: started,
                    time: ev.duration,
                    pageref: 'page_1',
                    request: {
                        method: ev.method,
                        url: ev.url,
                        httpVersion: 'HTTP/1.1',
                        headers: reqHeaders,
                        queryString: [],
                        ...(ev.requestBody ? { postData: { mimeType: ev.requestMimeType ?? 'application/json', text: ev.requestBody } } : {}),
                        headersSize: -1,
                        bodySize: ev.requestBody ? ev.requestBody.length : 0,
                    },
                    response: {
                        status: ev.status,
                        statusText: httpStatusText(ev.status),
                        httpVersion: 'HTTP/1.1',
                        headers: respHeaders,
                        content: {
                            size: ev.responseSize ?? (ev.responseBody?.length ?? 0),
                            mimeType: ev.responseMimeType ?? 'application/json',
                            text: ev.responseBody ?? '',
                        },
                        redirectURL: '',
                        headersSize: -1,
                        bodySize: ev.responseSize ?? -1,
                    },
                    cache: {},
                    timings: { send: 0, wait: ev.duration, receive: 0 },
                };
            }),
        },
    };
}
/** Latest performance snapshot from the widget */
let perfSnapshot = null;
/** Per-route performance snapshots keyed by pathname */
const routeStore = new Map();
/** SSE clients for live event streaming */
const sseClients = new Set();
function broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of sseClients) {
        try {
            res.write(payload);
        }
        catch {
            sseClients.delete(res);
        }
    }
}
function createRuntimeServer(port = exports.DEFAULT_RUNTIME_PORT, projectRoot = process.cwd()) {
    const widgetJs = (0, widget_script_js_1.generateWidgetScript)({ serverPort: port, projectRoot });
    const server = http_1.default.createServer(async (req, res) => {
        const url = req.url ?? '/';
        const method = req.method ?? 'GET';
        // Preflight
        if (method === 'OPTIONS') {
            cors(res);
            res.writeHead(204);
            res.end();
            return;
        }
        // ── Widget script ──────────────────────────────────────────────────────────
        if (url === '/__arcguard/widget.js' && method === 'GET') {
            cors(res);
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(widgetJs);
            return;
        }
        // ── Runtime snapshot ───────────────────────────────────────────────────────
        if (url === '/__arcguard/snapshot' && method === 'GET') {
            return json(res, (0, storage_js_1.getSnapshot)());
        }
        // ── Clear store ────────────────────────────────────────────────────────────
        if (url === '/__arcguard/clear' && method === 'POST') {
            storage_js_1.consoleStore.clear();
            storage_js_1.networkStore.clear();
            return json(res, { ok: true });
        }
        // ── SSE event stream ───────────────────────────────────────────────────────
        if (url === '/__arcguard/events' && method === 'GET') {
            cors(res);
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            });
            res.write('retry: 3000\n\n');
            sseClients.add(res);
            req.on('close', () => sseClients.delete(res));
            return;
        }
        // ── Receive console event ──────────────────────────────────────────────────
        if (url === '/__arcguard/console' && method === 'POST') {
            try {
                const body = await readBody(req);
                const ev = JSON.parse(body);
                const event = { ...ev, id: storage_js_1.consoleStore.nextId() };
                storage_js_1.consoleStore.push(event);
                broadcast('console', event);
                return json(res, { ok: true, id: event.id });
            }
            catch {
                return json(res, { error: 'invalid body' }, 400);
            }
        }
        // ── Receive network event ──────────────────────────────────────────────────
        if (url === '/__arcguard/network' && method === 'POST') {
            try {
                const body = await readBody(req);
                const ev = JSON.parse(body);
                const event = { ...ev, id: storage_js_1.networkStore.nextId() };
                storage_js_1.networkStore.push(event);
                broadcast('network', event);
                return json(res, { ok: true, id: event.id });
            }
            catch {
                return json(res, { error: 'invalid body' }, 400);
            }
        }
        // ── Page URL ping ──────────────────────────────────────────────────────────
        if (url === '/__arcguard/ping' && method === 'POST') {
            try {
                const body = await readBody(req);
                const { pageUrl } = JSON.parse(body);
                if (pageUrl)
                    (0, storage_js_1.setPageUrl)(pageUrl);
                return json(res, { ok: true });
            }
            catch {
                return json(res, { error: 'invalid body' }, 400);
            }
        }
        // ── Git changes ───────────────────────────────────────────────────────────
        if (url === '/__arcguard/git' && method === 'GET') {
            try {
                const run = (cmd) => {
                    try {
                        return (0, child_process_1.execSync)(cmd, { cwd: projectRoot, encoding: 'utf8', timeout: 5000 });
                    }
                    catch {
                        return '';
                    }
                };
                const log = run('git log --oneline -15');
                const stat = run('git diff HEAD --stat');
                const branch = run('git rev-parse --abbrev-ref HEAD').trim();
                const diff = run('git diff HEAD -- . ":(exclude)*.lock" ":(exclude)node_modules"').slice(0, 8000);
                return json(res, { branch, log, stat, diff });
            }
            catch (e) {
                return json(res, { error: String(e) }, 500);
            }
        }
        // ── Store inspected element ───────────────────────────────────────────────
        if (url === '/__arcguard/element' && method === 'POST') {
            try {
                const body = await readBody(req);
                const el = JSON.parse(body);
                (0, storage_js_1.setLastElement)(el);
                broadcast('element', el);
                return json(res, { ok: true });
            }
            catch {
                return json(res, { error: 'invalid body' }, 400);
            }
        }
        // ── Get inspected element ─────────────────────────────────────────────────
        if (url === '/__arcguard/element' && method === 'GET') {
            return json(res, (0, storage_js_1.getLastElement)() ?? { error: 'no element inspected yet' });
        }
        // ── Store action event ────────────────────────────────────────────────────
        if (url === '/__arcguard/action' && method === 'POST') {
            try {
                const body = await readBody(req);
                const ev = JSON.parse(body);
                const event = { ...ev, id: storage_js_1.actionStore.nextId() };
                storage_js_1.actionStore.push(event);
                broadcast('action', event);
                return json(res, { ok: true, id: event.id });
            }
            catch {
                return json(res, { error: 'invalid body' }, 400);
            }
        }
        // ── Get action timeline ───────────────────────────────────────────────────
        if (url === '/__arcguard/actions' && method === 'GET') {
            return json(res, storage_js_1.actionStore.all());
        }
        // ── HAR export ───────────────────────────────────────────────────────────
        if (url === '/__arcguard/har' && method === 'GET') {
            cors(res);
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="arcguard.har"',
            });
            const snap = (0, storage_js_1.getSnapshot)();
            res.end(JSON.stringify(generateHAR(snap.pageUrl), null, 2));
            return;
        }
        // ── Save screen recording ─────────────────────────────────────────────────
        if (url === '/__arcguard/recording' && method === 'POST') {
            try {
                const chunks = [];
                req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                await new Promise((resolve, reject) => {
                    req.on('end', resolve);
                    req.on('error', reject);
                });
                const data = Buffer.concat(chunks);
                const dir = path_1.default.join(projectRoot, '.arcguard');
                fs_1.default.mkdirSync(dir, { recursive: true });
                const filename = `recording-${Date.now()}.webm`;
                const filepath = path_1.default.join(dir, filename);
                fs_1.default.writeFileSync(filepath, data);
                // Also save HAR alongside the recording
                const snap = (0, storage_js_1.getSnapshot)();
                const harPath = path_1.default.join(dir, `recording-${Date.now()}.har`);
                fs_1.default.writeFileSync(harPath, JSON.stringify(generateHAR(snap.pageUrl), null, 2));
                console.log(`\n  \x1b[36m[ArchGuard]\x1b[0m Recording saved → \x1b[2m${path_1.default.relative(projectRoot, filepath)}\x1b[0m`);
                return json(res, { ok: true, path: path_1.default.relative(projectRoot, filepath) });
            }
            catch (e) {
                return json(res, { error: String(e) }, 500);
            }
        }
        // ── Ask Claude via claude CLI (SSE stream) ────────────────────────────────
        if (url === '/__arcguard/ask' && method === 'POST') {
            let body;
            try {
                body = await readBody(req);
            }
            catch {
                return json(res, { error: 'invalid body' }, 400);
            }
            let question = '', context = '';
            try {
                ({ question, context } = JSON.parse(body));
            }
            catch {
                return json(res, { error: 'invalid json' }, 400);
            }
            const prompt = context
                ? `${context}\n\n---\n\nUser question: ${question}`
                : question;
            cors(res);
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            });
            const send = (ev, data) => {
                res.write(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`);
            };
            const child = (0, child_process_1.spawn)('claude', ['-p', prompt], {
                cwd: projectRoot,
                env: { ...process.env },
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            child.stdout.on('data', (chunk) => send('token', chunk.toString()));
            child.stderr.on('data', (chunk) => send('error', chunk.toString()));
            child.on('close', (code) => {
                send('done', code === 0 ? 'ok' : `exited with code ${code}`);
                res.end();
            });
            child.on('error', (err) => {
                send('error', `Failed to run claude CLI: ${err.message}. Make sure \`claude\` is installed and on your PATH.`);
                send('done', 'error');
                res.end();
            });
            req.on('close', () => child.kill());
            return;
        }
        // ── Generate regression test (SSE stream) ────────────────────────────────
        if (url === '/__arcguard/generate-test' && method === 'POST') {
            let body;
            try {
                body = await readBody(req);
            }
            catch {
                return json(res, { error: 'invalid body' }, 400);
            }
            let context = '';
            try {
                ({ context } = JSON.parse(body));
            }
            catch {
                return json(res, { error: 'invalid json' }, 400);
            }
            const conventions = detectTestConventions(projectRoot);
            const prompt = buildTestPrompt(conventions, context);
            cors(res);
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            });
            // Helpers — log: process status lines shown in the terminal view
            //           token: actual code output streamed into the code block
            //           meta: structured events (framework, filepath, done)
            const sendLog = (line) => res.write(`data: ${JSON.stringify({ type: 'log', value: line })}\n\n`);
            const sendCode = (chunk) => res.write(`data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`);
            const sendMeta = (type, value) => res.write(`data: ${JSON.stringify({ type, value })}\n\n`);
            sendLog(`▶ Test type: ${inferTestType(context).toUpperCase()}`);
            sendLog(`▶ Framework: ${conventions.framework}  ext: ${conventions.ext}`);
            sendLog(`▶ Test dirs: ${conventions.testDirs.slice(0, 3).join(', ') || '(none found — will create)'}`);
            sendLog(`▶ Spawning: claude -p <prompt>`);
            sendMeta('framework', conventions.framework);
            const child = (0, child_process_1.spawn)('claude', ['-p', prompt], {
                cwd: projectRoot,
                env: { ...process.env },
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            sendLog(`▶ Process started (PID ${child.pid ?? '?'})`);
            let testCode = '';
            // stdout → actual generated code, streamed token-by-token
            child.stdout.on('data', (chunk) => {
                const token = chunk.toString();
                testCode += token;
                sendCode(token);
            });
            // stderr → process info / warnings, shown live in the terminal view
            child.stderr.on('data', (chunk) => {
                chunk.toString().split('\n').forEach(line => {
                    if (line.trim())
                        sendLog(line);
                });
            });
            child.on('close', (code) => {
                sendLog(`▶ Process exited (code ${code})`);
                if (testCode.trim()) {
                    // Strip markdown fences if Claude wrapped output in them
                    const clean = testCode.replace(/^```[\w]*\r?\n?/m, '').replace(/\r?\n?```\s*$/m, '').trim();
                    const match = clean.match(/from ['"]([^'"]+)['"]/);
                    const base = match ? path_1.default.basename(match[1]).replace(/\.(tsx?|jsx?)$/, '') : 'regression';
                    // Use the first existing test dir, or fall back to a sensible default
                    const targetDir = conventions.testDirs[0]
                        ?? (conventions.framework === 'Playwright' ? 'tests' : conventions.framework === 'Cypress' ? 'cypress/e2e' : 'src/__tests__');
                    const dir = path_1.default.join(projectRoot, targetDir);
                    fs_1.default.mkdirSync(dir, { recursive: true });
                    const filename = `${base}.regression${conventions.ext}`;
                    const filepath = path_1.default.join(dir, filename);
                    fs_1.default.writeFileSync(filepath, clean, 'utf8');
                    const rel = path_1.default.relative(projectRoot, filepath);
                    sendLog(`✓ Test saved → ${rel}`);
                    console.log(`\n  \x1b[36m[ArchGuard]\x1b[0m Regression test saved → \x1b[2m${rel}\x1b[0m`);
                    sendMeta('filepath', rel);
                }
                else {
                    sendLog('✗ No test code was generated. Check the logs above for errors.');
                }
                sendMeta('done', code === 0 ? 'ok' : `exited ${code}`);
                res.end();
            });
            child.on('error', (err) => {
                sendLog(`✗ Failed to spawn claude: ${err.message}`);
                sendLog('  → Install the CLI: npm install -g @anthropic-ai/claude-code');
                sendMeta('done', 'spawn-error');
                res.end();
            });
            req.on('close', () => child.kill());
            return;
        }
        // ── Store / retrieve performance snapshot ─────────────────────────────────
        if (url === '/__arcguard/perf' && method === 'POST') {
            try {
                const body = await readBody(req);
                perfSnapshot = JSON.parse(body);
                return json(res, { ok: true });
            }
            catch {
                return json(res, { error: 'invalid body' }, 400);
            }
        }
        if (url === '/__arcguard/perf' && method === 'GET') {
            if (!perfSnapshot)
                return json(res, { error: 'No performance data yet — open the Perf tab in the widget and click "Send to Claude".' }, 404);
            return json(res, perfSnapshot);
        }
        // ── Store / retrieve per-route snapshot ───────────────────────────────────
        if (url === '/__arcguard/perf/route' && method === 'POST') {
            try {
                const body = await readBody(req);
                const snap = JSON.parse(body);
                if (snap?.path)
                    routeStore.set(snap.path, snap);
                return json(res, { ok: true });
            }
            catch {
                return json(res, { error: 'invalid body' }, 400);
            }
        }
        if (url === '/__arcguard/perf/routes' && method === 'GET') {
            return json(res, Object.fromEntries(routeStore));
        }
        // ── Dependency Intelligence ────────────────────────────────────────────────
        if (url === '/__arcguard/dep/check' && method === 'POST') {
            try {
                const body = await readBody(req);
                const { name, version } = JSON.parse(body);
                if (!name)
                    return json(res, { error: 'name is required' }, 400);
                const pkg = version ? `${name}@${version}` : name;
                const report = await (0, index_js_1.checkPackage)(pkg, projectRoot);
                return json(res, report);
            }
            catch (err) {
                return json(res, { error: String(err) }, 500);
            }
        }
        if (url.startsWith('/__arcguard/dep/audit') && method === 'GET') {
            const qs = new URL(`http://x${url}`).searchParams;
            const limit = parseInt(qs.get('limit') ?? '8', 10);
            try {
                const reports = await (0, index_js_1.auditAllDeps)(projectRoot, limit);
                return json(res, reports);
            }
            catch (err) {
                return json(res, { error: String(err) }, 500);
            }
        }
        // TODO Stage 2: /__arcguard/run-test endpoint
        // POST { filePath, framework, verify: boolean }
        // verify=false → run once, stream output, return pass/fail
        // verify=true  → 3-step loop: run (PASS) → git stash → run (FAIL) → git stash pop → verdict
        // 404
        json(res, { error: 'not found' }, 404);
    });
    server.listen(port, '127.0.0.1', () => {
        // intentionally silent — caller prints the message
    });
    return server;
}
//# sourceMappingURL=server.js.map