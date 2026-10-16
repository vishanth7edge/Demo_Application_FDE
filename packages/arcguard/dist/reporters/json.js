"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonReport = jsonReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Writes a structured JSON report to disk.
 * This is the source-of-truth format for the future HTML dashboard (Phase 7).
 */
function jsonReport(result, outputPath) {
    const dir = path_1.default.dirname(outputPath);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    const report = {
        schemaVersion: '2.0',
        generatedAt: new Date().toISOString(),
        projectRoot: result.scanResult.projectRoot,
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
    fs_1.default.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`[arcguard] JSON report written to ${outputPath}`);
}
//# sourceMappingURL=json.js.map