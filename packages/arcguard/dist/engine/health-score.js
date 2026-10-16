"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeReusabilityScore = computeReusabilityScore;
exports.computeHealthScore = computeHealthScore;
const CATEGORY_DEFS = [
    { label: 'Architecture', categories: ['ddd'], errorWeight: 10, warnWeight: 4, weight: 0.30 },
    { label: 'Dependencies', categories: ['dependency'], errorWeight: 15, warnWeight: 5, weight: 0.20 },
    { label: 'Structure', categories: ['structure'], errorWeight: 6, warnWeight: 2, weight: 0.15 },
    { label: 'Naming', categories: ['naming'], errorWeight: 3, warnWeight: 1, weight: 0.20 },
    { label: 'Reusability', categories: ['reusability'], errorWeight: 4, warnWeight: 1.5, weight: 0.15 },
];
function toGrade(score) {
    if (score >= 90)
        return 'A';
    if (score >= 80)
        return 'B';
    if (score >= 70)
        return 'C';
    if (score >= 60)
        return 'D';
    return 'F';
}
const SHARED_PATTERN = /(\/|^)(shared|components|ui)(\/|$)/i;
const COMPONENT_FILE = (f) => /\.[jt]sx$/.test(f.path) && !/(\.test\.|\.spec\.|\.stories\.)/i.test(f.path);
const METRIC_DEFS = [
    {
        label: 'Props Interface',
        ruleId: 'reusability/props-interface-required',
        denomFilter: (f) => /\.tsx$/.test(f.path) && !/(\.test\.|\.spec\.|\.stories\.)/i.test(f.path),
    },
    {
        label: 'Style Discipline',
        ruleId: 'reusability/no-hardcoded-styles',
        denomFilter: COMPONENT_FILE,
    },
    {
        label: 'Store Isolation',
        ruleId: 'reusability/no-store-in-shared-component',
        denomFilter: (f) => /\.(tsx?|jsx)$/.test(f.path) && SHARED_PATTERN.test(f.relativePath),
    },
    {
        label: 'Component Size',
        ruleId: 'reusability/max-component-lines',
        denomFilter: COMPONENT_FILE,
    },
    {
        label: 'Code Uniqueness',
        ruleId: 'reusability/no-duplicate-blocks',
        denomFilter: (f) => /\.tsx?$/.test(f.path) && !/\.d\.ts$/.test(f.path) && !/(\.test\.|\.spec\.)/i.test(f.path),
    },
    {
        label: 'Reuse Coverage',
        ruleId: 'graph/reuse-coverage',
        compute: (result) => {
            const sharedComponents = result.scanResult.files.filter(f => COMPONENT_FILE(f) && SHARED_PATTERN.test(f.relativePath));
            const rev = result.scanResult.dependencyGraph.reverseEdges;
            const reused = sharedComponents.filter(f => (rev.get(f.path)?.size ?? 0) >= 2).length;
            return { compliant: reused, total: sharedComponents.length };
        },
    },
];
function computeReusabilityScore(result) {
    const violatingFiles = {};
    for (const v of result.violations) {
        if (!violatingFiles[v.ruleId])
            violatingFiles[v.ruleId] = new Set();
        violatingFiles[v.ruleId].add(v.relativePath);
    }
    const files = result.scanResult.files;
    const metrics = METRIC_DEFS.map(def => {
        let total, compliant, violations;
        if (def.compute) {
            ({ compliant, total } = def.compute(result));
            violations = total - compliant;
        }
        else {
            total = files.filter(def.denomFilter).length;
            violations = violatingFiles[def.ruleId]?.size ?? 0;
            compliant = Math.max(0, total - violations);
        }
        const score = total === 0 ? 100 : Math.min(100, Math.max(0, Math.round(compliant / total * 100)));
        return { label: def.label, ruleId: def.ruleId, score, grade: toGrade(score), compliant, total, violations };
    });
    const active = metrics.filter(m => m.total > 0);
    const overall = active.length === 0
        ? 100
        : Math.min(100, Math.max(0, Math.round(active.reduce((s, m) => s + m.score, 0) / active.length)));
    return { overall, grade: toGrade(overall), metrics };
}
// ── Health score ──────────────────────────────────────────────────────────────
function computeHealthScore(result) {
    const totalFiles = Math.max(1, result.scanResult.files.length);
    const cleanFiles = totalFiles - result.summary.filesWithViolations;
    // Single pass: tally errors and warnings per rule category
    const catErrors = {};
    const catWarnings = {};
    const catTotal = {};
    for (const v of result.violations) {
        const c = v.category;
        if (v.severity === 'error')
            catErrors[c] = (catErrors[c] ?? 0) + 1;
        else if (v.severity === 'warning')
            catWarnings[c] = (catWarnings[c] ?? 0) + 1;
        catTotal[c] = (catTotal[c] ?? 0) + 1;
    }
    const categories = CATEGORY_DEFS.map(def => {
        let errors = 0, warnings = 0, violations = 0;
        for (const cat of def.categories) {
            errors += catErrors[cat] ?? 0;
            warnings += catWarnings[cat] ?? 0;
            violations += catTotal[cat] ?? 0;
        }
        const raw = 100
            - (errors / totalFiles) * 100 * def.errorWeight
            - (warnings / totalFiles) * 100 * def.warnWeight;
        const score = Math.min(100, Math.max(0, Math.round(raw)));
        return {
            label: def.label,
            category: def.categories.join('+'),
            score,
            grade: toGrade(score),
            errors,
            warnings,
            violations,
        };
    });
    const overall = Math.min(100, Math.max(0, Math.round(categories.reduce((sum, cat, i) => sum + cat.score * CATEGORY_DEFS[i].weight, 0))));
    return { overall, grade: toGrade(overall), categories, cleanFiles, totalFiles };
}
//# sourceMappingURL=health-score.js.map