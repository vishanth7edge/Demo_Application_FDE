"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readContext = readContext;
exports.isStale = isStale;
exports.buildContext = buildContext;
exports.getOrBuildContext = getOrBuildContext;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const loader_1 = require("../config/loader");
const scanner_1 = require("../scanner");
const engine_1 = require("../engine");
const rules_1 = require("../rules");
const CACHE_DIR = '.archguard';
const CONTEXT_FILE = 'context.json';
const REPORT_FILE = 'report.json';
function cacheDir(projectRoot) {
    return path_1.default.join(projectRoot, CACHE_DIR);
}
function readContext(projectRoot) {
    const file = path_1.default.join(cacheDir(projectRoot), CONTEXT_FILE);
    if (!fs_1.default.existsSync(file))
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(file, 'utf-8'));
    }
    catch {
        return null;
    }
}
function isStale(projectRoot) {
    const ctxFile = path_1.default.join(cacheDir(projectRoot), CONTEXT_FILE);
    if (!fs_1.default.existsSync(ctxFile))
        return true;
    const cacheMtime = fs_1.default.statSync(ctxFile).mtimeMs;
    const sourceFiles = fast_glob_1.default.sync('src/**/*.{ts,tsx,js,jsx}', {
        cwd: projectRoot,
        ignore: ['**/node_modules/**', '**/dist/**'],
        absolute: true,
    });
    return sourceFiles.some(f => fs_1.default.statSync(f).mtimeMs > cacheMtime);
}
function deriveStructure(files, projectRoot) {
    const domains = new Set();
    const sharedComponents = [];
    const layerMap = {
        presentation: [],
        application: [],
        domain: [],
        infrastructure: [],
    };
    const DOMAIN_SEG = /(?:\/|^)domains?\/([^/]+)/i;
    const FEATURE_SEG = /(?:\/|^)features?\/([^/]+)/i;
    const LAYER_MAP = {
        ui: 'presentation', presentation: 'presentation',
        application: 'application', app: 'application',
        domain: 'domain',
        infrastructure: 'infrastructure', infra: 'infrastructure',
    };
    const SHARED_SEG = /(?:\/|^)(shared|components|ui)(?:\/|$)/i;
    for (const f of files) {
        const rel = f.relativePath;
        const dm = DOMAIN_SEG.exec(rel) ?? FEATURE_SEG.exec(rel);
        if (dm)
            domains.add(dm[1]);
        if (SHARED_SEG.test(rel) && /\.[jt]sx$/.test(f.path)) {
            sharedComponents.push(f.relativePath);
        }
        const segs = rel.split('/');
        for (const seg of segs) {
            const layer = LAYER_MAP[seg.toLowerCase()];
            if (layer) {
                layerMap[layer].push(f.relativePath);
                break;
            }
        }
    }
    return {
        domains: Array.from(domains).sort(),
        sharedComponents: sharedComponents.slice(0, 50),
        layerMap,
    };
}
async function buildContext(projectRoot) {
    const config = (0, loader_1.loadConfig)(projectRoot);
    const scanResult = await (0, scanner_1.scan)(projectRoot, config);
    const engine = new engine_1.RuleEngine();
    engine.registerAll(rules_1.ALL_RULES);
    const result = engine.run(scanResult, config);
    const context = {
        generatedAt: new Date().toISOString(),
        projectRoot,
        healthScore: result.healthScore,
        reusabilityScore: result.reusabilityScore,
        summary: {
            files: scanResult.files.length,
            violations: result.violations.length,
            errors: result.summary.errors,
            warnings: result.summary.warnings,
        },
        structure: deriveStructure(scanResult.files, projectRoot),
        violations: result.violations.map(v => ({
            ruleId: v.ruleId,
            severity: v.severity,
            file: v.relativePath,
            line: v.line,
            message: v.message,
            suggestion: v.suggestion,
        })),
    };
    const dir = cacheDir(projectRoot);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.writeFileSync(path_1.default.join(dir, CONTEXT_FILE), JSON.stringify(context, null, 2), 'utf-8');
    const report = {
        schemaVersion: '2.0',
        generatedAt: context.generatedAt,
        projectRoot,
        duration: result.duration,
        healthScore: result.healthScore,
        reusabilityScore: result.reusabilityScore,
        summary: result.summary,
        violations: result.violations.map(v => ({
            ruleId: v.ruleId,
            ruleName: v.ruleName,
            severity: v.severity,
            category: v.category,
            message: v.message,
            relativePath: v.relativePath,
            line: v.line,
            column: v.column,
            suggestion: v.suggestion,
        })),
    };
    fs_1.default.writeFileSync(path_1.default.join(dir, REPORT_FILE), JSON.stringify(report, null, 2), 'utf-8');
    return context;
}
async function getOrBuildContext(projectRoot) {
    if (!isStale(projectRoot)) {
        const cached = readContext(projectRoot);
        if (cached)
            return cached;
    }
    return buildContext(projectRoot);
}
//# sourceMappingURL=cache.js.map