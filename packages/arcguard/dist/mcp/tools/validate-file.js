"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidateFile = handleValidateFile;
const path_1 = __importDefault(require("path"));
const loader_1 = require("../../config/loader");
const scanner_1 = require("../../scanner");
const engine_1 = require("../../engine");
const rules_1 = require("../../rules");
async function handleValidateFile(args, defaultProject) {
    const projectRoot = typeof args.projectRoot === 'string' ? args.projectRoot : defaultProject;
    const filePath = typeof args.path === 'string' ? args.path : '';
    if (!filePath)
        throw new Error('path is required');
    const relPath = path_1.default.isAbsolute(filePath)
        ? path_1.default.relative(projectRoot, filePath)
        : filePath;
    const config = (0, loader_1.loadConfig)(projectRoot);
    const scanResult = await (0, scanner_1.scan)(projectRoot, config);
    const engine = new engine_1.RuleEngine();
    engine.registerAll(rules_1.ALL_RULES);
    const result = engine.run(scanResult, config);
    return result.violations
        .filter(v => v.relativePath === relPath || v.relativePath.endsWith(relPath))
        .map(v => ({
        ruleId: v.ruleId,
        ruleName: v.ruleName,
        severity: v.severity,
        category: v.category,
        message: v.message,
        relativePath: v.relativePath,
        line: v.line,
        column: v.column,
        suggestion: v.suggestion,
    }));
}
//# sourceMappingURL=validate-file.js.map