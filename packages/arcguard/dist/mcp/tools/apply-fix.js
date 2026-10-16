"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApplyFix = handleApplyFix;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const loader_1 = require("../../config/loader");
const scanner_1 = require("../../scanner");
const cache_1 = require("../cache");
const RENAME_RE = /^Rename to "(.+)"\./;
function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function handleApplyFix(args, defaultProject) {
    const projectRoot = typeof args.projectRoot === 'string' ? args.projectRoot : defaultProject;
    const fileArg = typeof args.file === 'string' ? args.file : '';
    const ruleId = typeof args.ruleId === 'string' ? args.ruleId : '';
    const dryRun = args.dryRun === true;
    if (!fileArg)
        throw new Error('file is required');
    if (!ruleId)
        throw new Error('ruleId is required');
    const absOldPath = path_1.default.isAbsolute(fileArg)
        ? fileArg
        : path_1.default.resolve(projectRoot, fileArg);
    const relFile = path_1.default.relative(projectRoot, absOldPath);
    const ctx = await (0, cache_1.getOrBuildContext)(projectRoot);
    const violation = ctx.violations.find(v => v.file === relFile && v.ruleId === ruleId);
    if (!violation) {
        return { applied: false, reason: `No violation for rule "${ruleId}" found in "${relFile}"` };
    }
    if (!violation.suggestion) {
        return { applied: false, reason: 'Violation has no automated suggestion' };
    }
    const renameMatch = RENAME_RE.exec(violation.suggestion);
    if (!renameMatch) {
        return { applied: false, reason: `Unrecognised suggestion format: "${violation.suggestion}"` };
    }
    const newBasename = renameMatch[1];
    // Only file renames are currently supported (new name must carry an extension)
    if (!path_1.default.extname(newBasename)) {
        return {
            applied: false,
            reason: 'In-code symbol renames are not yet supported — only file renames are handled.',
        };
    }
    const dir = path_1.default.dirname(absOldPath);
    const absNewPath = path_1.default.join(dir, newBasename);
    const newRel = path_1.default.relative(projectRoot, absNewPath);
    if (!fs_1.default.existsSync(absOldPath)) {
        return { applied: false, reason: `File not found: ${relFile}` };
    }
    // Scan BEFORE renaming so reverseEdges still reference the old path
    const config = (0, loader_1.loadConfig)(projectRoot);
    const scanResult = await (0, scanner_1.scan)(projectRoot, config);
    const importers = [...(scanResult.dependencyGraph.reverseEdges.get(absOldPath) ?? [])];
    if (dryRun) {
        return {
            applied: false,
            dryRun: true,
            wouldRename: { from: relFile, to: newRel },
            wouldUpdateImporters: importers.map(p => path_1.default.relative(projectRoot, p)),
        };
    }
    // Prefer git mv so the rename appears in history cleanly
    const git = (0, child_process_1.spawnSync)('git', ['mv', relFile, newRel], {
        cwd: projectRoot,
        encoding: 'utf-8',
    });
    if (git.status !== 0) {
        fs_1.default.renameSync(absOldPath, absNewPath);
    }
    // Rewrite import paths in every importer
    const oldStem = path_1.default.basename(absOldPath, path_1.default.extname(absOldPath));
    const newStem = path_1.default.basename(absNewPath, path_1.default.extname(absNewPath));
    const updatedImporters = [];
    // Match: quote + optional-dir + oldStem + optional-.ext + closing-quote
    // The lookahead prevents matching oldStem when it's a prefix of a longer name
    const importPathRe = new RegExp(`(['"])((?:[^'"]*/)?)${escapeRe(oldStem)}((?:\\.[jt]sx?)?['"])`, 'g');
    for (const imp of importers) {
        const content = fs_1.default.readFileSync(imp, 'utf-8');
        const newContent = content.replace(importPathRe, `$1$2${newStem}$3`);
        if (newContent !== content) {
            fs_1.default.writeFileSync(imp, newContent, 'utf-8');
            updatedImporters.push(path_1.default.relative(projectRoot, imp));
        }
    }
    // Rebuild cache so subsequent MCP calls see the updated state
    await (0, cache_1.buildContext)(projectRoot);
    return {
        applied: true,
        action: 'rename',
        from: relFile,
        to: newRel,
        updatedImporters,
        message: `Renamed ${relFile} → ${newRel} and updated ${updatedImporters.length} importer(s).`,
    };
}
//# sourceMappingURL=apply-fix.js.map