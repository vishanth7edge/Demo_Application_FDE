"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sarifReport = sarifReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');
/**
 * Produces a SARIF 2.1.0 file for GitHub Actions inline PR annotations.
 *
 * Usage in .github/workflows/ci.yml:
 *   - run: arcguard check --reporter sarif --output arcguard-results.sarif
 *   - uses: github/codeql-action/upload-sarif@v3
 *     with:
 *       sarif_file: arcguard-results.sarif
 */
function sarifReport(result, projectRoot, outputPath) {
    const rules = buildSarifRules(result);
    const results = buildSarifResults(result, projectRoot);
    const sarif = {
        $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
        version: '2.1.0',
        runs: [
            {
                tool: {
                    driver: {
                        name: 'arcguard',
                        version,
                        informationUri: 'https://github.com/7edge/arcguard',
                        rules,
                    },
                },
                results,
                invocations: [
                    {
                        executionSuccessful: result.summary.errors === 0,
                        toolExecutionNotifications: [],
                    },
                ],
            },
        ],
    };
    const dir = path_1.default.dirname(outputPath);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.writeFileSync(outputPath, JSON.stringify(sarif, null, 2), 'utf-8');
    console.log(`[arcguard] SARIF report written to ${outputPath}`);
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function buildSarifRules(result) {
    const seen = new Map();
    for (const v of result.violations) {
        if (!seen.has(v.ruleId)) {
            seen.set(v.ruleId, {
                id: v.ruleId,
                name: v.ruleName,
                shortDescription: { text: v.message },
            });
        }
    }
    return Array.from(seen.values());
}
function buildSarifResults(result, projectRoot) {
    return result.violations.map(v => ({
        ruleId: v.ruleId,
        level: toSarifLevel(v.severity),
        message: {
            text: v.suggestion ? `${v.message} ${v.suggestion}` : v.message,
        },
        locations: [
            {
                physicalLocation: {
                    artifactLocation: {
                        uri: v.relativePath.replace(/\\/g, '/'),
                        uriBaseId: '%SRCROOT%',
                    },
                    region: {
                        startLine: v.line ?? 1,
                        startColumn: v.column ?? 1,
                    },
                },
            },
        ],
    }));
}
function toSarifLevel(severity) {
    if (severity === 'error')
        return 'error';
    if (severity === 'warning')
        return 'warning';
    return 'note';
}
//# sourceMappingURL=sarif.js.map