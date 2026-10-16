"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetViolations = handleGetViolations;
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const cache_1 = require("../cache");
async function handleGetViolations(args, defaultProject) {
    const projectRoot = typeof args.projectRoot === 'string' ? args.projectRoot : defaultProject;
    const ctx = await (0, cache_1.getOrBuildContext)(projectRoot);
    let violations = ctx.violations;
    // Severity / rule / file substring filters
    if (typeof args.severity === 'string') {
        violations = violations.filter(v => v.severity === args.severity);
    }
    if (typeof args.ruleId === 'string') {
        violations = violations.filter(v => v.ruleId === args.ruleId);
    }
    if (typeof args.file === 'string') {
        const needle = args.file.toLowerCase();
        violations = violations.filter(v => v.file.toLowerCase().includes(needle));
    }
    // Changed-files filter: only violations from files modified since baseRef
    if (typeof args.baseRef === 'string') {
        const baseRef = args.baseRef;
        const git = (0, child_process_1.spawnSync)('git', ['diff', '--name-only', baseRef], {
            cwd: projectRoot,
            encoding: 'utf-8',
        });
        if (git.status === 0) {
            const changedFiles = new Set(git.stdout.trim().split('\n').filter(Boolean));
            // git diff paths are relative to repo root; violation .file is relative to projectRoot
            violations = violations.filter(v => {
                const rel = path_1.default.relative(projectRoot, path_1.default.resolve(projectRoot, v.file));
                return changedFiles.has(rel) || changedFiles.has(v.file);
            });
        }
    }
    const total = violations.length;
    // Pagination
    const offset = typeof args.offset === 'number' ? Math.max(0, args.offset) : 0;
    const limit = typeof args.limit === 'number' ? Math.min(500, Math.max(1, args.limit)) : 100;
    const page = violations.slice(offset, offset + limit);
    return {
        total,
        offset,
        limit,
        returned: page.length,
        hasMore: offset + page.length < total,
        violations: page,
    };
}
//# sourceMappingURL=get-violations.js.map