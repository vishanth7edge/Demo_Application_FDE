"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFixCommand = registerFixCommand;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const cache_1 = require("../../mcp/cache");
function registerFixCommand(program) {
    program
        .command('fix [dir]')
        .description('Use Claude Code to automatically fix architecture violations')
        .option('--rule <ruleId>', 'Only fix violations from this rule (e.g. "ddd/no-cross-domain")')
        .option('--severity <level>', 'Only fix violations of this severity (default: error)')
        .option('--all', 'Fix all violations regardless of severity')
        .option('--dry-run', 'Plan mode — show what Claude would do without editing files')
        .option('--model <model>', 'Claude model (e.g. "sonnet", "opus")')
        .action(async (dir, opts) => {
        const projectRoot = dir ? path_1.default.resolve(dir) : process.cwd();
        // Verify claude CLI is available
        const which = (0, child_process_1.spawnSync)('which', ['claude'], { encoding: 'utf-8' });
        if (which.status !== 0) {
            console.error(chalk_1.default.red('\n  [arcguard] claude CLI not found.\n') +
                chalk_1.default.dim('  Install Claude Code: https://claude.ai/code\n'));
            process.exit(1);
        }
        // Fresh analysis so Claude works from current state
        console.log(chalk_1.default.dim('\n  Analyzing project…'));
        const ctx = await (0, cache_1.buildContext)(projectRoot);
        // Apply filters to determine scope
        let violations = ctx.violations;
        if (opts.rule)
            violations = violations.filter(v => v.ruleId === opts.rule);
        if (!opts.all) {
            const sev = opts.severity ?? 'error';
            violations = violations.filter(v => v.severity === sev);
        }
        if (violations.length === 0) {
            console.log(chalk_1.default.green('\n  No violations match the filter — nothing to fix.\n'));
            return;
        }
        const modeLabel = opts.dryRun ? chalk_1.default.yellow('plan mode') : chalk_1.default.cyan('fix mode');
        console.log(`  ${violations.length} violation(s) to fix  [${modeLabel}]`);
        // Warn when the scope is very large — Claude works best on focused batches
        if (violations.length > 100) {
            const topRules = topRuleIds(violations, 5);
            console.log(chalk_1.default.yellow(`\n  Warning: ${violations.length} violations is a large batch.`) +
                chalk_1.default.dim(`\n  Claude will work through them but may need multiple runs.\n`) +
                chalk_1.default.dim(`  Tip: narrow the scope with --rule to fix one rule at a time:\n`) +
                topRules.map(([id, n]) => chalk_1.default.dim(`    arcguard fix --rule ${id}  (${n} violations)`)).join('\n'));
        }
        console.log('');
        // Write a temp MCP config pointing at this arcguard binary
        const cliPath = process.argv[1];
        const mcpConfig = {
            mcpServers: {
                arcguard: {
                    command: process.execPath,
                    args: [cliPath, 'mcp', '--project', projectRoot],
                    type: 'stdio',
                },
            },
        };
        const tmpMcp = path_1.default.join(os_1.default.tmpdir(), `arcguard-mcp-${Date.now()}.json`);
        fs_1.default.writeFileSync(tmpMcp, JSON.stringify(mcpConfig), 'utf-8');
        const prompt = buildPrompt(projectRoot, violations, opts);
        const claudeArgs = [
            '-p', prompt,
            '--verbose',
            '--output-format', 'stream-json',
            '--mcp-config', tmpMcp,
            '--strict-mcp-config',
            '--permission-mode', opts.dryRun ? 'plan' : 'bypassPermissions',
        ];
        if (opts.model)
            claudeArgs.push('--model', opts.model);
        const SEP = chalk_1.default.dim('─'.repeat(60));
        // Spinner while Claude boots and connects to the MCP server (can take 15-30s)
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let frameIdx = 0;
        const spinner = setInterval(() => {
            process.stdout.write(`\r  ${frames[frameIdx++ % frames.length]} ${chalk_1.default.dim('Claude is starting up…')}`);
        }, 100);
        const child = (0, child_process_1.spawn)('claude', claudeArgs, {
            cwd: projectRoot,
            stdio: ['inherit', 'pipe', 'pipe'],
        });
        // Clear spinner and print separator as soon as Claude's process starts
        child.on('spawn', () => {
            clearInterval(spinner);
            process.stdout.write(`\r${' '.repeat(45)}\r`);
            console.log(SEP);
        });
        // Parse stream-json lines → structured progress output
        const rl = readline_1.default.createInterface({ input: child.stdout, crlfDelay: Infinity });
        rl.on('line', (line) => {
            if (!line.trim())
                return;
            try {
                renderEvent(JSON.parse(line));
            }
            catch {
                process.stdout.write(line + '\n');
            }
        });
        // Surface stderr so errors from Claude or the MCP server are always visible
        child.stderr.on('data', (chunk) => process.stderr.write(chunk));
        const exitCode = await new Promise((resolve) => {
            child.on('error', (err) => {
                clearInterval(spinner);
                process.stdout.write(`\r${' '.repeat(45)}\r`);
                console.error(chalk_1.default.red(`\n  [arcguard] Failed to start Claude: ${err.message}\n`));
                resolve(1);
            });
            child.on('close', (code, signal) => {
                clearInterval(spinner);
                resolve(signal === 'SIGINT' || signal === 'SIGTERM' ? -1 : (code ?? 1));
            });
        });
        console.log('\n' + SEP);
        try {
            fs_1.default.unlinkSync(tmpMcp);
        }
        catch { /* best-effort */ }
        if (exitCode === -1) {
            console.log(chalk_1.default.yellow('\n  Cancelled.\n'));
            process.exit(0);
        }
        if (exitCode !== 0) {
            console.error(chalk_1.default.red(`\n  [arcguard] Claude exited with code ${exitCode}.\n`));
        }
        else {
            console.log(chalk_1.default.green('\n  Done. Review changes with: git diff\n'));
        }
        process.exit(exitCode);
    });
}
// ─── stream-json event renderer ──────────────────────────────────────────────
function renderEvent(event) {
    const type = event.type;
    if (type === 'assistant') {
        const content = event.message?.content ?? [];
        for (const block of content) {
            if (block.type === 'text' && block.text?.trim()) {
                process.stdout.write('\n' + block.text.trimEnd() + '\n');
            }
        }
    }
    else if (type === 'tool_use') {
        const tu = (event.tool_use ?? event);
        const name = (tu.name ?? event.name);
        const input = (tu.input ?? {});
        console.log(formatToolUse(name, input));
    }
    else if (type === 'result') {
        const cost = event.total_cost_usd;
        if (cost != null) {
            process.stdout.write(chalk_1.default.dim(`  cost: $${cost.toFixed(4)}\n`));
        }
    }
    // Ignore: system, tool_result, message (noise)
}
function formatToolUse(name, input) {
    const file = input.file_path ?? input.path ?? input.relativePath ?? '';
    const short = file ? path_1.default.relative(process.cwd(), path_1.default.resolve(file)) : '';
    switch (name) {
        case 'Read': return chalk_1.default.dim(`  📖  Read      ${short || file}`);
        case 'Edit': return chalk_1.default.dim(`  ✏️   Edit      ${short || file}`);
        case 'Write': return chalk_1.default.dim(`  📝  Write     ${short || file}`);
        case 'Bash': return chalk_1.default.dim(`  $   ${(input.command ?? '').slice(0, 70)}`);
        case 'get_context': return chalk_1.default.cyan(`  🔍  get_context              loading project analysis`);
        case 'get_violations_summary': return chalk_1.default.cyan(`  📊  get_violations_summary   triage summary`);
        case 'get_violations': return chalk_1.default.cyan(`  📋  get_violations            filtering results`);
        case 'list_rules': return chalk_1.default.cyan(`  📖  list_rules               rule catalog`);
        case 'apply_fix': return chalk_1.default.cyan(`  🔧  apply_fix                ${short || file}`);
        case 'validate_file': return chalk_1.default.cyan(`  ✅  validate_file            ${short || file}`);
        case 'scaffold': return chalk_1.default.cyan(`  🏗   scaffold                 ${input.name ?? ''}`);
        default: return chalk_1.default.dim(`  🔧  ${name}  ${short || JSON.stringify(input).slice(0, 60)}`);
    }
}
function topRuleIds(violations, n) {
    const counts = {};
    for (const v of violations)
        counts[v.ruleId] = (counts[v.ruleId] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n);
}
function buildPrompt(projectRoot, violations, opts) {
    const ruleScope = opts.rule ? `rule "${opts.rule}"` : 'all rules';
    const sevScope = opts.all ? 'all severities' : `severity "${opts.severity ?? 'error'}"`;
    const violationLines = violations
        .slice(0, 30)
        .map(v => `  - ${v.file}${v.line ? `:${v.line}` : ''} [${v.ruleId}] ${v.message}`)
        .join('\n');
    const truncNote = violations.length > 30
        ? `\n  … and ${violations.length - 30} more (call get_context for the full list)\n`
        : '';
    return `You are an architecture remediation assistant for a TypeScript project governed by ArchGuard.

Project root: ${projectRoot}
Task: Fix ${violations.length} violation(s) — ${ruleScope}, ${sevScope}

Violations to fix:
${violationLines}${truncNote}

Workflow:
1. Call get_context on the arcguard MCP server to load the full project context, structure, and complete violation list.
2. Fix each violation by editing the source file. Follow the suggestion field when present; otherwise apply the minimal change that satisfies the rule.
3. After editing a file, call validate_file with that file's relative path to confirm the violation is cleared. If it is not cleared, revise your fix.
4. Continue until all violations are resolved. If a violation genuinely cannot be fixed automatically (e.g. requires design decisions), note it and move on.
5. Summarise what was fixed and what (if anything) requires manual attention.

Constraints:
- Do not refactor code beyond what is needed to clear each violation.
- Do not change public API signatures unless the violation explicitly requires it.
- Prefer minimal diffs.`;
}
//# sourceMappingURL=fix.js.map