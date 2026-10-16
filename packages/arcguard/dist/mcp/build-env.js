"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBuildEnv = detectBuildEnv;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fast_glob_1 = __importDefault(require("fast-glob"));
// ─── Known risky / heavy packages ────────────────────────────────────────────
const RISK_REGISTRY = [
    // Heavy bundle contributors
    { name: 'moment', reason: 'heavy-bundle', detail: 'Use date-fns or dayjs instead (~700 KB minified)' },
    { name: 'lodash', reason: 'heavy-bundle', detail: 'Import individual functions (lodash/get) or use native ES equivalents' },
    { name: '@mui/icons-material', reason: 'heavy-bundle', detail: 'Tree-shake carefully; full import adds ~15 MB to bundle' },
    { name: 'antd', reason: 'heavy-bundle', detail: 'Enable babel-plugin-import for tree-shaking' },
    { name: '@ant-design/icons', reason: 'heavy-bundle', detail: 'Import individual icons — full import is very large' },
    { name: 'rxjs', reason: 'heavy-bundle', detail: 'Import from rxjs/operators to avoid barrel re-exports' },
    { name: 'draft-js', reason: 'heavy-bundle', detail: 'Large rich-text library; consider Slate or Lexical' },
    { name: 'highlight.js', reason: 'heavy-bundle', detail: 'Register only needed languages via highlight.js/lib/core' },
    { name: 'chart.js', reason: 'heavy-bundle', detail: 'Register only needed components via tree-shaking API' },
    { name: 'three', reason: 'heavy-bundle', detail: 'Very large 3D library; lazy-load and split aggressively' },
    { name: 'xlsx', reason: 'heavy-bundle', detail: 'Consider exceljs or papaparse for smaller footprint' },
    { name: 'pdfjs-dist', reason: 'heavy-bundle', detail: 'Very large; load worker separately and lazy-import' },
    { name: 'firebase', reason: 'heavy-bundle', detail: 'Import only used sub-packages (firebase/auth, firebase/firestore)' },
    // Deprecated / abandoned
    { name: 'node-sass', reason: 'deprecated', detail: 'Use sass (Dart Sass) instead' },
    { name: 'request', reason: 'deprecated', detail: 'Archived; use axios or native fetch' },
    { name: 'faker', reason: 'deprecated', detail: 'Archived; use @faker-js/faker' },
    { name: 'colors', reason: 'deprecated', detail: 'Abandoned with malicious commit; use chalk or kleur' },
    { name: 'event-stream', reason: 'deprecated', detail: 'Historic supply-chain incident; avoid' },
    { name: 'core-js', reason: 'deprecated', detail: 'Pin to a specific version; wildcard ^3 causes large polyfill bloat' },
    { name: 'react-router', reason: 'peer-conflict', detail: 'Ensure v5 or v6 — APIs differ completely; mixing causes runtime errors' },
    { name: 'tslint', reason: 'deprecated', detail: 'Deprecated; migrate to ESLint + @typescript-eslint' },
    { name: 'enzyme', reason: 'deprecated', detail: 'No React 18 adapter; migrate to @testing-library/react' },
    // Risky / security-sensitive
    { name: 'minimist', reason: 'risky', detail: 'Known prototype-pollution CVEs; ensure patched version' },
    { name: 'serialize-javascript', reason: 'risky', detail: 'XSS risk if user-controlled data passed in; ensure >=3.1.0' },
    { name: 'html-webpack-plugin', reason: 'risky', detail: 'Old versions have XSS via template injection; keep updated' },
];
// ─── Bundler detection ────────────────────────────────────────────────────────
const BUNDLER_CONFIGS = [
    { files: ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'], tool: 'vite' },
    { files: ['next.config.js', 'next.config.ts', 'next.config.mjs'], tool: 'next' },
    { files: ['webpack.config.js', 'webpack.config.ts', 'webpack.config.mjs'], tool: 'webpack' },
    { files: ['rspack.config.js', 'rspack.config.ts'], tool: 'rspack' },
    { files: ['.parcelrc', 'parcel.config.js'], tool: 'parcel' },
    { files: ['esbuild.config.js', 'esbuild.config.mjs'], tool: 'esbuild' },
];
function detectBundler(root, allDeps) {
    for (const { files, tool } of BUNDLER_CONFIGS) {
        for (const f of files) {
            const full = path_1.default.join(root, f);
            if (fs_1.default.existsSync(full)) {
                return { tool, configFile: f, sourceMapsEnabled: detectSourceMaps(root, f, tool) };
            }
        }
    }
    // CRA: react-scripts in deps, no explicit webpack config
    if (allDeps['react-scripts']) {
        return { tool: 'cra', configFile: null, sourceMapsEnabled: true };
    }
    // Turbopack: next + --turbo flag in scripts (detected later) or turbopack dep
    if (allDeps['turbopack'] || allDeps['@vercel/turbopack']) {
        return { tool: 'turbopack', configFile: null, sourceMapsEnabled: null };
    }
    if (allDeps['webpack']) {
        return { tool: 'webpack', configFile: null, sourceMapsEnabled: null };
    }
    if (allDeps['vite']) {
        return { tool: 'vite', configFile: null, sourceMapsEnabled: null };
    }
    return { tool: null, configFile: null, sourceMapsEnabled: null };
}
function detectSourceMaps(root, configFile, _tool) {
    // Check tsconfig first
    for (const tsConfig of ['tsconfig.json', 'tsconfig.app.json']) {
        const full = path_1.default.join(root, tsConfig);
        if (!fs_1.default.existsSync(full))
            continue;
        try {
            const raw = JSON.parse(fs_1.default.readFileSync(full, 'utf-8'));
            if (typeof raw?.compilerOptions?.sourceMap === 'boolean') {
                return raw.compilerOptions.sourceMap;
            }
        }
        catch { /* ignore */ }
    }
    // Scan the config file for "sourcemap" / "sourceMap" keywords
    const cfgPath = path_1.default.join(root, configFile);
    if (fs_1.default.existsSync(cfgPath)) {
        const src = fs_1.default.readFileSync(cfgPath, 'utf-8');
        if (/sourcemap\s*:\s*true|sourceMap\s*:\s*true/i.test(src))
            return true;
        if (/sourcemap\s*:\s*false|sourceMap\s*:\s*false/i.test(src))
            return false;
    }
    return null;
}
// ─── Build scripts ────────────────────────────────────────────────────────────
const BUILD_SCRIPT_KEYS = /^(build|dev|start|preview|serve|test|lint|typecheck|type-check|compile|export|deploy)$/i;
function extractBuildScripts(root) {
    const pkgPath = path_1.default.join(root, 'package.json');
    if (!fs_1.default.existsSync(pkgPath))
        return {};
    try {
        const pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf-8'));
        const scripts = pkg.scripts ?? {};
        return Object.fromEntries(Object.entries(scripts).filter(([k]) => BUILD_SCRIPT_KEYS.test(k)));
    }
    catch {
        return {};
    }
}
// ─── Entry points ─────────────────────────────────────────────────────────────
const SCRIPT_SRC_RE = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
function detectEntryPoints(root) {
    const htmlFiles = fast_glob_1.default.sync(['**/*.html', '!**/node_modules/**', '!**/dist/**', '!**/.archguard/**'], {
        cwd: root,
        absolute: false,
    });
    const entries = [];
    for (const html of htmlFiles.slice(0, 20)) {
        const src = fs_1.default.readFileSync(path_1.default.join(root, html), 'utf-8');
        let m;
        SCRIPT_SRC_RE.lastIndex = 0;
        while ((m = SCRIPT_SRC_RE.exec(src)) !== null) {
            entries.push({ htmlFile: html, scriptSrc: m[1] });
        }
    }
    return entries;
}
// ─── Dependency risks ─────────────────────────────────────────────────────────
function detectDependencyRisks(root) {
    const pkgPath = path_1.default.join(root, 'package.json');
    if (!fs_1.default.existsSync(pkgPath))
        return [];
    let pkg;
    try {
        pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf-8'));
    }
    catch {
        return [];
    }
    const allDeps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
    };
    const risks = [];
    for (const { name, reason, detail } of RISK_REGISTRY) {
        if (allDeps[name]) {
            risks.push({ name, version: allDeps[name], reason, detail });
        }
    }
    return risks;
}
function readAllDeps(root) {
    const pkgPath = path_1.default.join(root, 'package.json');
    if (!fs_1.default.existsSync(pkgPath))
        return {};
    try {
        const pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf-8'));
        return { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    }
    catch {
        return {};
    }
}
// ─── Static assets ────────────────────────────────────────────────────────────
const LARGE_ASSET_THRESHOLD_KB = 100;
const IMAGE_EXTS = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?)$/i;
function detectStaticAssets(root) {
    const candidateDirs = ['public', 'static', 'assets', 'src/assets'];
    let publicDir = null;
    for (const d of candidateDirs) {
        if (fs_1.default.existsSync(path_1.default.join(root, d))) {
            publicDir = d;
            break;
        }
    }
    const largeFiles = [];
    if (publicDir) {
        const files = fast_glob_1.default.sync(`${publicDir}/**/*`, {
            cwd: root,
            absolute: false,
            onlyFiles: true,
        });
        for (const f of files) {
            if (!IMAGE_EXTS.test(f))
                continue;
            try {
                const stat = fs_1.default.statSync(path_1.default.join(root, f));
                const sizeKb = Math.round(stat.size / 1024);
                if (sizeKb >= LARGE_ASSET_THRESHOLD_KB) {
                    largeFiles.push({ path: f, sizeKb });
                }
            }
            catch { /* skip */ }
        }
        largeFiles.sort((a, b) => b.sizeKb - a.sizeKb);
    }
    return { publicDir, largeFiles: largeFiles.slice(0, 30) };
}
// ─── Server / static-serving config ──────────────────────────────────────────
const SERVING_CONFIGS = [
    {
        file: 'vercel.json',
        compressionRe: /compress|gzip|brotli/i,
        cacheRe: /cache-control|s-maxage|max-age/i,
        staticDirRe: /"public"\s*:|"outputDirectory"/i,
    },
    {
        file: 'netlify.toml',
        compressionRe: /compress|brotli|gzip/i,
        cacheRe: /Cache-Control|max-age/i,
        staticDirRe: /publish\s*=/i,
    },
    {
        file: 'firebase.json',
        compressionRe: /compression/i,
        cacheRe: /Cache-Control|maxAgeSeconds/i,
        staticDirRe: /"public"\s*:/i,
    },
    {
        file: 'nginx.conf',
        compressionRe: /gzip\s+on|brotli\s+on/i,
        cacheRe: /cache-control|expires|add_header.*Cache/i,
        staticDirRe: /root\s+/i,
    },
    {
        file: '.htaccess',
        compressionRe: /mod_deflate|mod_brotli|AddOutputFilterByType/i,
        cacheRe: /Cache-Control|ExpiresByType|Header set Cache/i,
        staticDirRe: undefined,
    },
    {
        file: 'server.js',
        compressionRe: /compression\(\)|express-static-gzip|compressible/i,
        cacheRe: /Cache-Control|maxAge|cacheControl/i,
        staticDirRe: /express\.static|serve-static/i,
    },
    {
        file: 'server.ts',
        compressionRe: /compression\(\)|express-static-gzip/i,
        cacheRe: /Cache-Control|maxAge|cacheControl/i,
        staticDirRe: /express\.static|serve-static/i,
    },
    {
        file: 'remix.config.js',
        compressionRe: /compress/i,
        cacheRe: /Cache-Control|cacheControl/i,
        staticDirRe: /publicPath|assetsBuildDirectory/i,
    },
];
function detectServingConfig(root) {
    const results = [];
    for (const { file, compressionRe, cacheRe, staticDirRe } of SERVING_CONFIGS) {
        const full = path_1.default.join(root, file);
        if (!fs_1.default.existsSync(full))
            continue;
        try {
            const src = fs_1.default.readFileSync(full, 'utf-8');
            let staticDir = null;
            if (staticDirRe) {
                const m = staticDirRe.exec(src);
                if (m) {
                    // Extract value after the match if it's a simple string
                    const after = src.slice(m.index + m[0].length, m.index + m[0].length + 60);
                    const val = /["']([^"']+)["']/.exec(after);
                    staticDir = val ? val[1] : '(see config)';
                }
            }
            results.push({
                file,
                compression: compressionRe.test(src),
                cacheControl: cacheRe.test(src),
                staticDir,
            });
        }
        catch { /* skip */ }
    }
    return results;
}
// ─── Public entry point ───────────────────────────────────────────────────────
function detectBuildEnv(projectRoot) {
    const allDeps = readAllDeps(projectRoot);
    return {
        bundler: detectBundler(projectRoot, allDeps),
        buildScripts: extractBuildScripts(projectRoot),
        entryPoints: detectEntryPoints(projectRoot),
        dependencyRisks: detectDependencyRisks(projectRoot),
        staticAssets: detectStaticAssets(projectRoot),
        servingConfig: detectServingConfig(projectRoot),
    };
}
//# sourceMappingURL=build-env.js.map