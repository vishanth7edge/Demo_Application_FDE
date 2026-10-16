"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAnalyzeCommand = registerAnalyzeCommand;
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const cache_1 = require("../../mcp/cache");
function registerAnalyzeCommand(program) {
    program
        .command('analyze [dir]')
        .description('Run architecture analysis and write cache to .archguard/ for MCP and CI use')
        .option('-q, --quiet', 'Suppress output except errors')
        .action(async (dir, opts) => {
        const projectRoot = dir ? path_1.default.resolve(dir) : process.cwd();
        if (!opts.quiet) {
            console.log(chalk_1.default.dim(`\n  Analyzing ${projectRoot} …\n`));
        }
        try {
            const ctx = await (0, cache_1.buildContext)(projectRoot);
            const cacheDir = path_1.default.join(projectRoot, '.archguard');
            if (!opts.quiet) {
                const h = ctx.healthScore;
                const hs = h ? `  Health     ${gradeColor(h.overall)(h.overall + ' / 100')}  ${gradeColor(h.overall)(h.grade)}` : '';
                const r = ctx.reusabilityScore;
                const rs = r ? `  Reuse      ${gradeColor(r.overall)(r.overall + ' / 100')}  ${gradeColor(r.overall)(r.grade)}` : '';
                const vs = ctx.summary.violations;
                const violStr = vs === 0
                    ? chalk_1.default.green('clean')
                    : chalk_1.default.yellow(`${vs} violation${vs !== 1 ? 's' : ''}`);
                console.log(chalk_1.default.bold('  Analysis complete\n'));
                console.log(`  Files      ${chalk_1.default.cyan(ctx.summary.files)}`);
                console.log(`  Violations ${violStr}`);
                if (hs)
                    console.log(hs);
                if (rs)
                    console.log(rs);
                console.log('');
                console.log(chalk_1.default.dim(`  Cache written to ${cacheDir}/\n`));
                console.log(chalk_1.default.dim(`  Run "arcguard init --mcp" to register the MCP server with Claude Code.\n`));
            }
        }
        catch (err) {
            console.error(`[arcguard] analyze failed: ${String(err)}`);
            process.exit(1);
        }
    });
}
function gradeColor(score) {
    if (score >= 90)
        return chalk_1.default.green;
    if (score >= 70)
        return chalk_1.default.yellow;
    return chalk_1.default.red;
}
//# sourceMappingURL=analyze.js.map