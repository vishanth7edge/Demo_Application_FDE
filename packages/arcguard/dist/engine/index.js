"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngine = void 0;
const health_score_1 = require("./health-score");
class RuleEngine {
    constructor() {
        this.rules = new Map();
    }
    register(rule) {
        this.rules.set(rule.id, rule);
    }
    registerAll(rules) {
        for (const rule of rules)
            this.register(rule);
    }
    getRule(id) {
        return this.rules.get(id);
    }
    listRules() {
        return Array.from(this.rules.values()).sort((a, b) => a.id.localeCompare(b.id));
    }
    run(scanResult, config) {
        const start = Date.now();
        const violations = [];
        const context = {
            files: scanResult.files,
            dependencyGraph: scanResult.dependencyGraph,
            config,
            projectRoot: scanResult.projectRoot,
        };
        for (const rule of this.rules.values()) {
            const cfg = config.rules?.[rule.id];
            if (cfg === false || cfg === undefined)
                continue;
            const severity = resolveSeverity(cfg, rule.severity);
            const options = resolveOptions(cfg);
            try {
                const found = rule.check(context, options);
                for (const v of found) {
                    violations.push({ ...v, severity });
                }
            }
            catch (err) {
                console.error(`[arcguard] Rule "${rule.id}" threw an error: ${String(err)}`);
            }
        }
        // Sort: errors first, then by file
        violations.sort((a, b) => {
            const sev = severityRank(b.severity) - severityRank(a.severity);
            if (sev !== 0)
                return sev;
            return a.relativePath.localeCompare(b.relativePath);
        });
        const result = {
            violations,
            summary: buildSummary(violations),
            scanResult,
            duration: Date.now() - start,
        };
        result.healthScore = (0, health_score_1.computeHealthScore)(result);
        result.reusabilityScore = (0, health_score_1.computeReusabilityScore)(result);
        return result;
    }
}
exports.RuleEngine = RuleEngine;
// ── Helpers ───────────────────────────────────────────────────────────────────
function resolveSeverity(cfg, fallback) {
    if (cfg === 'error' || cfg === 'warning' || cfg === 'info')
        return cfg;
    if (Array.isArray(cfg))
        return cfg[0];
    return fallback;
}
function resolveOptions(cfg) {
    if (Array.isArray(cfg) && cfg.length > 1)
        return cfg[1];
    return undefined;
}
function severityRank(s) {
    return s === 'error' ? 2 : s === 'warning' ? 1 : 0;
}
function buildSummary(violations) {
    const summary = {
        total: violations.length,
        errors: 0,
        warnings: 0,
        infos: 0,
        byCategory: {},
        byRule: {},
        filesWithViolations: 0,
    };
    const files = new Set();
    for (const v of violations) {
        if (v.severity === 'error')
            summary.errors++;
        else if (v.severity === 'warning')
            summary.warnings++;
        else
            summary.infos++;
        summary.byCategory[v.category] = (summary.byCategory[v.category] ?? 0) + 1;
        summary.byRule[v.ruleId] = (summary.byRule[v.ruleId] ?? 0) + 1;
        files.add(v.filePath);
    }
    summary.filesWithViolations = files.size;
    return summary;
}
//# sourceMappingURL=index.js.map