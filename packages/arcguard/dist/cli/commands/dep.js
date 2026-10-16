"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDepCommand = registerDepCommand;
const path_1 = __importDefault(require("path"));
const index_js_1 = require("../../dep/index.js");
const report_js_1 = require("../../dep/report.js");
const fs_1 = __importDefault(require("fs"));
// ─── Formatting helpers ───────────────────────────────────────────────────────
const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
    cyan: '\x1b[36m', blue: '\x1b[34m', magenta: '\x1b[35m',
};
function bar(filled, total, width = 20) {
    const n = Math.round((filled / total) * width);
    return '█'.repeat(n) + '░'.repeat(width - n);
}
function fmtBytes(b) {
    if (b >= 1048576)
        return `${(b / 1048576).toFixed(1)} MB`;
    if (b >= 1024)
        return `${(b / 1024).toFixed(1)} kB`;
    return `${b} B`;
}
function fmtNum(n) {
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${(n / 1000).toFixed(0)}k`;
    return String(n);
}
function verdictColor(v) {
    if (v === 'ADOPT')
        return C.green;
    if (v === 'REVIEW')
        return C.yellow;
    return C.red;
}
function printReport(report) {
    const vc = verdictColor(report.verdict);
    const icon = report.verdict === 'ADOPT' ? '✓' : report.verdict === 'REVIEW' ? '⚠' : '✗';
    const w = 66;
    const line = '─'.repeat(w);
    console.log('');
    console.log(`${C.dim}╭─${C.reset}${C.bold} ${report.name}@${report.resolvedVersion} ${C.reset}${C.dim}${'─'.repeat(Math.max(0, w - report.name.length - report.resolvedVersion.length - 3))}╮${C.reset}`);
    console.log(`${C.dim}│${C.reset}  Score ${C.bold}${report.score.total}${C.reset} / 100   Verdict ${vc}${C.bold}${icon}  ${report.verdict}${C.reset}`);
    console.log(`${C.dim}│${C.reset}`);
    // Vulnerability priority tier
    if (report.vulnPriority) {
        const [tier, color] = report.vulnPriority === 'used+vulnerable' ? ['🔴 USED · VULNERABLE — actively imported in your source', C.red] :
            report.vulnPriority === 'installed+vulnerable' ? ['🟠 INSTALLED · VULNERABLE — not imported but present', C.yellow] :
                ['🟡 TRANSITIVE · VULNERABLE — pulled in by another package', C.dim];
        console.log(`${C.dim}│${C.reset}  ${color}${tier}${C.reset}`);
    }
    console.log(`${C.dim}│${C.reset}  Security    ${C.green}${bar(report.score.security, 40)}${C.reset}  ${report.score.security} / 40   ${report.vulnerabilities.length === 0 ? '0 vulns' : `${report.vulnerabilities.length} vuln${report.vulnerabilities.length > 1 ? 's' : ''}`}`);
    const maintNote = [
        `last: ${report.registry.daysSincePublish}d ago`,
        `${report.registry.releasesLastYear} rel/yr`,
        `${report.registry.maintainerCount} maintainer${report.registry.maintainerCount !== 1 ? 's' : ''}`,
        report.github.available && report.github.daysSinceLastCommit !== null ? `commit: ${report.github.daysSinceLastCommit}d ago` : '',
    ].filter(Boolean).join('  ');
    console.log(`${C.dim}│${C.reset}  Maintenance ${C.blue}${bar(report.score.maintenance, 30)}${C.reset}  ${report.score.maintenance} / 30   ${C.dim}${maintNote}${C.reset}`);
    const fb = report.score.fitBreakdown;
    const fitNote = [
        fb.noDuplicate ? '' : `duplicate: ${fb.duplicateNote}`,
        !fb.noLayerViolation ? 'layer violation' : '',
        !fb.licenseOk ? 'license concern' : '',
    ].filter(Boolean).join('  ');
    console.log(`${C.dim}│${C.reset}  Fit         ${report.score.fit >= 20 ? C.green : report.score.fit >= 10 ? C.yellow : C.red}${bar(report.score.fit, 30)}${C.reset}  ${report.score.fit} / 30${fitNote ? `   ${C.dim}${fitNote}${C.reset}` : ''}`);
    // Vulnerabilities
    if (report.vulnerabilities.length > 0) {
        console.log(`${C.dim}│${C.reset}`);
        const fixedByUpgrade = report.vulnerabilities.length > 0 && report.latestVulnerabilities.length === 0 && report.updateType !== 'none';
        const stillVulnerable = report.latestVulnerabilities.length > 0;
        const vulnHeader = fixedByUpgrade
            ? `${C.red}✗  Vulnerabilities${C.reset}  ${C.green}(fixed in ${report.registry.latestVersion} — upgrade recommended)${C.reset}`
            : stillVulnerable
                ? `${C.red}✗  Vulnerabilities${C.reset}  ${C.red}(also present in latest ${report.registry.latestVersion})${C.reset}`
                : `${C.red}✗  Vulnerabilities${C.reset}`;
        console.log(`${C.dim}│${C.reset}  ${vulnHeader}`);
        for (const v of report.vulnerabilities.slice(0, 5)) {
            const sc = v.severity === 'critical' || v.severity === 'high' ? C.red : v.severity === 'moderate' ? C.yellow : C.dim;
            const ids = [v.id, v.ghsa].filter(Boolean).join(' / ');
            const cvss = v.cvssScore !== null ? `  CVSS ${v.cvssScore.toFixed(1)}` : '';
            console.log(`${C.dim}│${C.reset}     ${sc}[${v.severity.toUpperCase()}${cvss}]${C.reset} ${v.title}`);
            console.log(`${C.dim}│${C.reset}           ${C.dim}${ids}  affected: ${v.range}${C.reset}`);
            if (v.url)
                console.log(`${C.dim}│${C.reset}           ${C.dim}${v.url}${C.reset}`);
        }
    }
    // Socket flags
    const socketFlags = [];
    if (report.socket.malware)
        socketFlags.push('malware');
    if (report.socket.installScripts)
        socketFlags.push('install-scripts');
    if (report.socket.obfuscatedCode)
        socketFlags.push('obfuscated-code');
    if (report.socket.protestware)
        socketFlags.push('protestware');
    if (report.socket.telemetry)
        socketFlags.push('telemetry');
    if (socketFlags.length > 0) {
        console.log(`${C.dim}│${C.reset}`);
        console.log(`${C.dim}│${C.reset}  ${C.red}⚠  Supply-chain flags:${C.reset} ${socketFlags.join(', ')}`);
    }
    // Duplicates
    if (report.project.duplicates.length > 0) {
        console.log(`${C.dim}│${C.reset}`);
        console.log(`${C.dim}│${C.reset}  ${C.yellow}⚠  Potential duplicate detected${C.reset}`);
        for (const dup of report.project.duplicates) {
            console.log(`${C.dim}│${C.reset}     ${C.bold}${dup.name}${C.reset} is already imported in ${dup.fileCount} file${dup.fileCount !== 1 ? 's' : ''} across ${dup.domains.length} domain${dup.domains.length !== 1 ? 's' : ''}`);
            console.log(`${C.dim}│${C.reset}     Category overlap: ${C.cyan}${dup.category}${C.reset}`);
        }
        console.log(`${C.dim}│${C.reset}     ${C.dim}Consider consolidating to one ${report.project.duplicates[0].category} solution${C.reset}`);
    }
    // Layer violation
    if (report.project.layerViolation) {
        console.log(`${C.dim}│${C.reset}`);
        console.log(`${C.dim}│${C.reset}  ${C.red}✗  Layer violation${C.reset}`);
        console.log(`${C.dim}│${C.reset}     ${report.project.layerViolationReason}`);
    }
    // License
    if (!report.project.licenseOk) {
        console.log(`${C.dim}│${C.reset}`);
        console.log(`${C.dim}│${C.reset}  ${C.yellow}⚠  License: ${report.registry.license}${C.reset}`);
        console.log(`${C.dim}│${C.reset}     ${report.project.licenseReason}`);
    }
    // Version update info
    const installed = report.project.installedVersion ?? report.project.currentVersion;
    const latest = report.registry.latestVersion;
    if (installed && latest && report.updateType !== 'none' && report.updateType !== 'unknown') {
        console.log(`${C.dim}│${C.reset}`);
        const typeColor = report.updateType === 'major' ? C.red : report.updateType === 'minor' ? C.yellow : C.dim;
        const typeLabel = report.updateType.toUpperCase();
        console.log(`${C.dim}│${C.reset}  ${C.yellow}↑  Update available${C.reset}   ${C.dim}installed:${C.reset} ${installed}  →  ${C.bold}${latest}${C.reset}  ${typeColor}[${typeLabel}]${C.reset}`);
        if (report.updateType === 'major') {
            console.log(`${C.dim}│${C.reset}     ${C.red}Breaking changes likely — review changelog before upgrading${C.reset}`);
        }
        if (report.project.usageFiles.length > 0) {
            console.log(`${C.dim}│${C.reset}     ${C.yellow}${report.project.usageFiles.length} file${report.project.usageFiles.length !== 1 ? 's' : ''} in this project import ${report.name} — may be affected:${C.reset}`);
            for (const f of report.project.usageFiles.slice(0, 6)) {
                console.log(`${C.dim}│${C.reset}       ${C.dim}${f}${C.reset}`);
            }
            if (report.project.usageFiles.length > 6) {
                console.log(`${C.dim}│${C.reset}       ${C.dim}… and ${report.project.usageFiles.length - 6} more${C.reset}`);
            }
        }
        if (report.registry.changelogUrl) {
            console.log(`${C.dim}│${C.reset}     ${C.dim}Changelog: ${report.registry.changelogUrl}${C.reset}`);
        }
    }
    // Footer metadata
    console.log(`${C.dim}│${C.reset}`);
    const footerParts = [
        `License ${report.registry.license || 'UNKNOWN'}`,
        report.bundle.available ? `Bundle +${fmtBytes(report.bundle.gzip)} gzip` : '',
        `Weekly DL ${fmtNum(report.registry.weeklyDownloads)}`,
        report.registry.maintainerCount > 0 ? `${report.registry.maintainerCount} maintainer${report.registry.maintainerCount !== 1 ? 's' : ''}` : '',
    ].filter(Boolean);
    console.log(`${C.dim}│${C.reset}  ${footerParts.join('   ')}`);
    // Verdict reason
    console.log(`${C.dim}│${C.reset}`);
    console.log(`${C.dim}│${C.reset}  ${vc}${report.verdictReason}${C.reset}`);
    console.log(`${C.dim}╰${'─'.repeat(w + 2)}╯${C.reset}`);
    console.log('');
}
// ─── Commands ─────────────────────────────────────────────────────────────────
function registerDepCommand(program) {
    const dep = program.command('dep').description('Dependency intelligence — evaluate packages before you install them');
    // arcguard dep check <package> [version-range]
    // Accepts:  minimist@<=1.2.5   OR   "minimist@<=1.2.5"   OR   minimist "<=1.2.5"
    dep
        .command('check <package> [versionRange]')
        .description('Evaluate a package before installing. Accepts name, name@version, or name + semver range.')
        .option('--json', 'Output machine-readable JSON')
        .option('--root <dir>', 'Project root (defaults to cwd)')
        .action(async (pkgArg, versionRange, opts) => {
        const root = opts.root ? path_1.default.resolve(opts.root) : process.cwd();
        // Merge: "minimist" + "<=1.2.5" → "minimist@<=1.2.5"
        const pkg = versionRange ? `${pkgArg}@${versionRange.replace(/^@/, '')}` : pkgArg;
        console.log(`\n  ${C.dim}Evaluating ${pkg}...${C.reset}`);
        try {
            const report = await (0, index_js_1.checkPackage)(pkg, root);
            if (opts.json) {
                console.log(JSON.stringify(report, null, 2));
            }
            else {
                printReport(report);
            }
            process.exit(report.verdict === 'REJECT' ? 1 : 0);
        }
        catch (err) {
            console.error(`\n  ${C.red}Error: ${String(err)}${C.reset}\n`);
            process.exit(1);
        }
    });
    // arcguard dep audit
    dep
        .command('audit')
        .description('Scan dependencies and report health issues')
        .option('--limit <n>', 'Number of packages to show (default 10, 0 = all)', '10')
        .option('--all', 'Show all packages, not just the worst 10')
        .option('--dev', 'Include devDependencies')
        .option('--transitive', 'Include transitive (indirect) dependencies — reads package-lock.json')
        .option('--json', 'Output machine-readable JSON')
        .option('--report [file]', 'Save an HTML report (default: arcguard-report.html)')
        .option('--root <dir>', 'Project root (defaults to cwd)')
        .action(async (opts) => {
        const root = opts.root ? path_1.default.resolve(opts.root) : process.cwd();
        const limit = opts.all ? 0 : parseInt(opts.limit, 10);
        const scanLabel = [opts.dev && 'dev', opts.transitive && 'transitive'].filter(Boolean).join('+') || 'prod';
        console.log(`\n  ${C.dim}Auditing ${scanLabel} dependencies...${C.reset}`);
        try {
            const reports = await (0, index_js_1.auditAllDeps)(root, limit, { dev: opts.dev, transitive: opts.transitive });
            if (opts.json) {
                console.log(JSON.stringify(reports, null, 2));
                return;
            }
            if (reports.length === 0) {
                console.log(`\n  ${C.green}✓ No production dependencies found or all healthy.${C.reset}\n`);
                return;
            }
            const label = opts.all || limit === 0 ? `All ${reports.length}` : `Worst ${reports.length}`;
            console.log(`\n  ${C.bold}${label} dependencies by score:${C.reset}\n`);
            for (const r of reports) {
                const vc = verdictColor(r.verdict);
                const icon = r.verdict === 'ADOPT' ? '✓' : r.verdict === 'REVIEW' ? '⚠' : '✗';
                const dupNote = r.project.duplicates.length > 0 ? `  ${C.yellow}duplicate${C.reset}` : '';
                const vulnNote = r.vulnerabilities.length > 0 ? `  ${C.red}${r.vulnerabilities.length} vuln${r.vulnerabilities.length !== 1 ? 's' : ''}${C.reset}` : '';
                console.log(`  ${vc}${icon} ${C.bold}${r.name}@${r.resolvedVersion}${C.reset}  ${r.score.total}/100${dupNote}${vulnNote}`);
                console.log(`    ${C.dim}${r.verdictReason}${C.reset}`);
            }
            console.log('');
            // Generate HTML report if --report flag is set
            if (opts.report !== undefined) {
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                const outFile = typeof opts.report === 'string' ? opts.report : 'arcguard-report.html';
                const outPath = path_1.default.resolve(outFile);
                const html = (0, report_js_1.generateHtmlReport)(reports, root);
                fs.writeFileSync(outPath, html, 'utf8');
                console.log(`  ${C.cyan}📄 Report saved: ${C.bold}${outPath}${C.reset}`);
                console.log(`  ${C.dim}Open in browser → click "Save as PDF"${C.reset}\n`);
            }
            const hasReject = reports.some(r => r.verdict === 'REJECT');
            const hasReview = reports.some(r => r.verdict === 'REVIEW');
            if (hasReject) {
                console.log(`  ${C.red}✗ REJECT packages found. Run ${C.bold}arcguard dep check <name>${C.reset}${C.red} for details.${C.reset}\n`);
                process.exit(1);
            }
            else if (hasReview) {
                console.log(`  ${C.yellow}⚠ REVIEW packages found. Run ${C.bold}arcguard dep check <name>${C.reset}${C.yellow} for details.${C.reset}\n`);
            }
            else {
                console.log(`  ${C.green}✓ All scanned dependencies passed.${C.reset}\n`);
            }
        }
        catch (err) {
            console.error(`\n  ${C.red}Error: ${String(err)}${C.reset}\n`);
            process.exit(1);
        }
    });
    // arcguard dep upgrade
    dep
        .command('upgrade')
        .description('Show exact npm install commands to fix vulnerable dependencies')
        .option('--dev', 'Include devDependencies')
        .option('--root <dir>', 'Project root (defaults to cwd)')
        .action(async (opts) => {
        const root = opts.root ? path_1.default.resolve(opts.root) : process.cwd();
        console.log(`\n  ${C.dim}Finding upgradeable vulnerable packages...${C.reset}\n`);
        try {
            const reports = await (0, index_js_1.auditAllDeps)(root, 0, { dev: opts.dev });
            const upgradeable = reports.filter(r => r.vulnerabilities.length > 0 &&
                r.latestVulnerabilities.length === 0 &&
                r.updateType !== 'none' && r.updateType !== 'unknown');
            const stuck = reports.filter(r => r.vulnerabilities.length > 0 && r.latestVulnerabilities.length > 0);
            if (upgradeable.length === 0 && stuck.length === 0) {
                console.log(`  ${C.green}✓ No vulnerable packages found.${C.reset}\n`);
                return;
            }
            if (upgradeable.length > 0) {
                console.log(`  ${C.green}${C.bold}Upgrades that fix vulnerabilities:${C.reset}\n`);
                for (const r of upgradeable) {
                    const vc = r.vulnerabilities.map(v => v.id).join(', ');
                    console.log(`  ${C.green}✓${C.reset} ${C.bold}${r.name}${C.reset}  ${r.resolvedVersion} → ${C.green}${r.registry.latestVersion}${C.reset}`);
                    console.log(`    ${C.dim}Fixes: ${vc}${C.reset}`);
                    console.log(`    ${C.cyan}npm install ${r.name}@${r.registry.latestVersion}${C.reset}\n`);
                }
            }
            if (stuck.length > 0) {
                console.log(`  ${C.red}${C.bold}Still vulnerable even in latest version:${C.reset}\n`);
                for (const r of stuck) {
                    console.log(`  ${C.red}✗${C.reset} ${C.bold}${r.name}@${r.resolvedVersion}${C.reset} — latest (${r.registry.latestVersion}) also vulnerable`);
                    console.log(`    ${C.dim}Consider a replacement or remove this dependency${C.reset}\n`);
                }
            }
        }
        catch (err) {
            console.error(`\n  ${C.red}Error: ${String(err)}${C.reset}\n`);
            process.exit(1);
        }
    });
    // arcguard dep compare <pkg1> <pkg2>
    dep
        .command('compare <pkg1> <pkg2>')
        .description('Compare two packages side by side before choosing one')
        .option('--root <dir>', 'Project root (defaults to cwd)')
        .action(async (pkg1, pkg2, opts) => {
        const root = opts.root ? path_1.default.resolve(opts.root) : process.cwd();
        console.log(`\n  ${C.dim}Comparing ${pkg1} vs ${pkg2}...${C.reset}\n`);
        try {
            const [r1, r2] = await Promise.all([(0, index_js_1.checkPackage)(pkg1, root), (0, index_js_1.checkPackage)(pkg2, root)]);
            const w = 30;
            const col = (s, width) => s.slice(0, width).padEnd(width);
            console.log(`${C.bold}${col('', 22)}${col(r1.name + '@' + r1.resolvedVersion, w)}${r2.name + '@' + r2.resolvedVersion}${C.reset}`);
            console.log('─'.repeat(22 + w + w));
            const row = (label, v1, v2, prefer) => {
                const n1 = parseFloat(v1), n2 = parseFloat(v2);
                const c1 = prefer && !isNaN(n1) && !isNaN(n2) ? (prefer === 'higher' ? (n1 >= n2 ? C.green : C.red) : (n1 <= n2 ? C.green : C.red)) : C.reset;
                const c2 = prefer && !isNaN(n1) && !isNaN(n2) ? (prefer === 'higher' ? (n2 >= n1 ? C.green : C.red) : (n2 <= n1 ? C.green : C.red)) : C.reset;
                console.log(`${col(label, 22)}${c1}${col(v1, w)}${C.reset}${c2}${v2}${C.reset}`);
            };
            const vc1 = verdictColor(r1.verdict), vc2 = verdictColor(r2.verdict);
            row('Score', `${r1.score.total}/100`, `${r2.score.total}/100`, 'higher');
            row('Verdict', `${vc1}${r1.verdict}${C.reset}`, `${vc2}${r2.verdict}${C.reset}`);
            row('Security', `${r1.score.security}/40  ${r1.vulnerabilities.length} vuln(s)`, `${r2.score.security}/40  ${r2.vulnerabilities.length} vuln(s)`, 'higher');
            row('Maintenance', `${r1.score.maintenance}/30`, `${r2.score.maintenance}/30`, 'higher');
            row('Releases/year', `${r1.registry.releasesLastYear}`, `${r2.registry.releasesLastYear}`, 'higher');
            row('Maintainers', `${r1.registry.maintainerCount}`, `${r2.registry.maintainerCount}`, 'higher');
            row('Weekly DL', fmtNum(r1.registry.weeklyDownloads), fmtNum(r2.registry.weeklyDownloads), 'higher');
            row('Bundle (gzip)', r1.bundle.available ? fmtBytes(r1.bundle.gzip) : 'n/a', r2.bundle.available ? fmtBytes(r2.bundle.gzip) : 'n/a', 'lower');
            row('License', r1.registry.license, r2.registry.license);
            row('Last publish', `${r1.registry.daysSincePublish}d ago`, `${r2.registry.daysSincePublish}d ago`, 'lower');
            console.log('─'.repeat(22 + w + w));
            const winner = r1.score.total >= r2.score.total ? r1 : r2;
            console.log(`\n  ${C.green}Recommendation: ${C.bold}${winner.name}${C.reset}${C.green} scores higher overall.${C.reset}\n`);
        }
        catch (err) {
            console.error(`\n  ${C.red}Error: ${String(err)}${C.reset}\n`);
            process.exit(1);
        }
    });
    // arcguard dep init-ci
    dep
        .command('init-ci')
        .description('Generate a GitHub Actions workflow that runs dep audit on every PR')
        .option('--root <dir>', 'Project root (defaults to cwd)')
        .action((opts) => {
        const root = opts.root ? path_1.default.resolve(opts.root) : process.cwd();
        const outDir = path_1.default.join(root, '.github', 'workflows');
        const outFile = path_1.default.join(outDir, 'arcguard.yml');
        const yml = `name: ArcGuard Dependency Audit

on:
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'

jobs:
  dep-audit:
    name: Dependency Health Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run ArcGuard audit
        run: npx arcguard dep audit --all
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Generate HTML report
        if: always()
        run: npx arcguard dep audit --all --report arcguard-report.html

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: arcguard-report
          path: arcguard-report.html
`;
        try {
            fs_1.default.mkdirSync(outDir, { recursive: true });
            fs_1.default.writeFileSync(outFile, yml, 'utf8');
            console.log(`\n  ${C.green}✓ Created ${C.bold}${outFile}${C.reset}\n`);
            console.log(`  ${C.dim}Commit and push — ArcGuard will run on every PR that touches package.json.${C.reset}\n`);
        }
        catch (err) {
            console.error(`\n  ${C.red}Error: ${String(err)}${C.reset}\n`);
            process.exit(1);
        }
    });
    // arcguard dep why <package>
    dep
        .command('why <package>')
        .description('Show why a package is in your dependency tree')
        .option('--root <dir>', 'Project root (defaults to cwd)')
        .action(async (pkg, opts) => {
        const root = opts.root ? path_1.default.resolve(opts.root) : process.cwd();
        const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
        try {
            const out = execSync(`npm ls ${pkg} --json`, {
                cwd: root, encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'],
            });
            const tree = JSON.parse(out);
            console.log(`\n  ${C.bold}Why is ${C.cyan}${pkg}${C.reset}${C.bold} in your dependency tree?${C.reset}\n`);
            printTree(tree, pkg, '  ', true);
            console.log('');
        }
        catch (err) {
            const msg = String(err);
            if (msg.includes('not found') || msg.includes('ELSPROBLEMS')) {
                console.log(`\n  ${C.yellow}${pkg}${C.reset} is not installed or not a direct dependency.\n`);
            }
            else {
                console.error(`\n  ${C.red}Error: ${msg}${C.reset}\n`);
            }
        }
    });
}
function printTree(node, target, indent, isRoot) {
    if (!isRoot) {
        const match = node.name === target;
        const color = match ? C.cyan + C.bold : C.dim;
        console.log(`${indent}${color}${node.name ?? '?'}@${node.version ?? '?'}${C.reset}`);
    }
    if (node.dependencies) {
        for (const [, child] of Object.entries(node.dependencies)) {
            printTree(child, target, indent + '  └─ ', false);
        }
    }
}
//# sourceMappingURL=dep.js.map