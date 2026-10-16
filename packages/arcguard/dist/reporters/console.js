"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleReport = consoleReport;
const chalk_1 = __importDefault(require("chalk"));
function consoleReport(result, projectRoot) {
    const { violations, summary, duration, scanResult } = result;
    if (violations.length === 0) {
        console.log(chalk_1.default.green('\n✔ No violations found.\n'));
        if (result.healthScore)
            printHealthScore(result.healthScore);
        if (result.reusabilityScore)
            printReusabilityScore(result.reusabilityScore);
        printStats(scanResult.files.length, duration);
        return;
    }
    // Group violations by file
    const byFile = new Map();
    for (const v of violations) {
        const list = byFile.get(v.relativePath) ?? [];
        list.push(v);
        byFile.set(v.relativePath, list);
    }
    console.log('');
    for (const [relPath, fileViolations] of byFile) {
        console.log(chalk_1.default.underline(relPath));
        for (const v of fileViolations) {
            const icon = severityIcon(v.severity);
            const loc = v.line ? chalk_1.default.dim(`:${v.line}`) : '';
            console.log(`  ${icon}  ${chalk_1.default.dim(v.ruleId)}${loc}  ${v.message}`);
            if (v.suggestion) {
                console.log(`     ${chalk_1.default.cyan('→')} ${chalk_1.default.dim(v.suggestion)}`);
            }
        }
        console.log('');
    }
    printSummaryTable(summary);
    if (result.healthScore)
        printHealthScore(result.healthScore);
    if (result.reusabilityScore)
        printReusabilityScore(result.reusabilityScore);
    printStats(scanResult.files.length, duration);
    // Exit hint
    if (summary.errors > 0) {
        console.log(chalk_1.default.red(`\n✖ ${summary.errors} error${summary.errors !== 1 ? 's' : ''} must be fixed before merging.\n`));
    }
}
// ── Private ───────────────────────────────────────────────────────────────────
function severityIcon(severity) {
    switch (severity) {
        case 'error': return chalk_1.default.red('error');
        case 'warning': return chalk_1.default.yellow('warn ');
        case 'info': return chalk_1.default.blue('info ');
    }
}
function printSummaryTable(summary) {
    const e = chalk_1.default.red(`${summary.errors} error${summary.errors !== 1 ? 's' : ''}`);
    const w = chalk_1.default.yellow(`${summary.warnings} warning${summary.warnings !== 1 ? 's' : ''}`);
    const i = chalk_1.default.blue(`${summary.infos} info`);
    console.log(chalk_1.default.bold(`Summary:  ${e}  ${w}  ${i}`));
    if (Object.keys(summary.byCategory).length) {
        console.log(chalk_1.default.dim('  By category:'));
        for (const [cat, count] of Object.entries(summary.byCategory)) {
            if (count > 0)
                console.log(chalk_1.default.dim(`    ${cat.padEnd(14)} ${count}`));
        }
    }
    console.log('');
}
function gradeColor(score) {
    if (score >= 90)
        return chalk_1.default.green;
    if (score >= 70)
        return chalk_1.default.yellow;
    return chalk_1.default.red;
}
function printHealthScore(h) {
    console.log(chalk_1.default.bold('\nRepository Health Score'));
    console.log(chalk_1.default.dim('═'.repeat(40)));
    const col = gradeColor(h.overall);
    console.log(`  ${'Overall'.padEnd(16)} ${col.bold(`${h.overall} / 100`)}   ${col.bold(h.grade)}\n`);
    for (const cat of h.categories) {
        const c = gradeColor(cat.score);
        const violStr = cat.violations === 0
            ? chalk_1.default.dim('clean')
            : chalk_1.default.dim(`${cat.violations} violation${cat.violations !== 1 ? 's' : ''}`);
        console.log(`  ${cat.label.padEnd(16)} ${c(`${cat.score}%`.padStart(4))}   ${c(cat.grade)}   ${violStr}`);
    }
    console.log('');
}
function printReusabilityScore(r) {
    console.log(chalk_1.default.bold('\nReusability Score'));
    console.log(chalk_1.default.dim('═'.repeat(40)));
    const col = gradeColor(r.overall);
    console.log(`  ${'Overall'.padEnd(16)} ${col.bold(`${r.overall} / 100`)}   ${col.bold(r.grade)}\n`);
    for (const m of r.metrics) {
        if (m.total === 0)
            continue;
        const c = gradeColor(m.score);
        const detail = chalk_1.default.dim(`${m.compliant}/${m.total}`);
        console.log(`  ${m.label.padEnd(16)} ${c(`${m.score}%`.padStart(4))}   ${c(m.grade)}   ${detail}`);
    }
    console.log('');
}
function printStats(fileCount, duration) {
    console.log(chalk_1.default.dim(`Scanned ${fileCount} file${fileCount !== 1 ? 's' : ''} in ${duration}ms`));
}
//# sourceMappingURL=console.js.map