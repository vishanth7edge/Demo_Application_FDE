"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetViolationsSummary = handleGetViolationsSummary;
const rules_1 = require("../../rules");
const cache_1 = require("../cache");
const DOMAIN_RE = /(?:^|\/)domains?\/([^/]+)/;
async function handleGetViolationsSummary(args, defaultProject) {
    const projectRoot = typeof args.projectRoot === 'string' ? args.projectRoot : defaultProject;
    const ctx = await (0, cache_1.getOrBuildContext)(projectRoot);
    const violations = ctx.violations;
    const fixableLookup = {};
    for (const r of rules_1.ALL_RULES)
        fixableLookup[r.id] = r.fixable ?? false;
    // Group by ruleId
    const ruleMap = {};
    for (const v of violations) {
        if (!ruleMap[v.ruleId])
            ruleMap[v.ruleId] = { severity: v.severity, count: 0 };
        ruleMap[v.ruleId].count++;
    }
    // Group by domain (segment after domains/ in relative path)
    const domainMap = {};
    for (const v of violations) {
        const m = DOMAIN_RE.exec(v.file);
        const domain = m ? m[1] : '(no domain)';
        if (!domainMap[domain])
            domainMap[domain] = { errors: 0, warnings: 0, total: 0 };
        domainMap[domain].total++;
        if (v.severity === 'error')
            domainMap[domain].errors++;
        else if (v.severity === 'warning')
            domainMap[domain].warnings++;
    }
    // Top files by violation count
    const fileCounts = {};
    for (const v of violations)
        fileCounts[v.file] = (fileCounts[v.file] ?? 0) + 1;
    const topFiles = Object.entries(fileCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([file, count]) => ({ file, count }));
    return {
        total: violations.length,
        errors: violations.filter(v => v.severity === 'error').length,
        warnings: violations.filter(v => v.severity === 'warning').length,
        infos: violations.filter(v => v.severity === 'info').length,
        byRule: Object.entries(ruleMap)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([ruleId, { severity, count }]) => ({
            ruleId,
            severity,
            count,
            autofixable: fixableLookup[ruleId] ?? false,
        })),
        byDomain: Object.entries(domainMap)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([domain, stats]) => ({ domain, ...stats })),
        topFiles,
    };
}
//# sourceMappingURL=get-violations-summary.js.map