"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInitCommand = registerInitCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const loader_1 = require("../../config/loader");
const MCP_CONFIG = {
    mcpServers: {
        arcguard: {
            command: 'npx',
            args: ['arcguard', 'mcp'],
            type: 'stdio',
        },
    },
};
function registerInitCommand(program) {
    program
        .command('init')
        .description('Create a default arcguard.config.json in the current directory')
        .option('--force', 'Overwrite existing config')
        .option('--mcp', 'Write .claude/mcp.json to register the ArchGuard MCP server with Claude Code')
        .action((opts) => {
        if (opts.mcp) {
            writeMcpConfig(process.cwd(), opts.force ?? false);
            return;
        }
        const dest = path_1.default.join(process.cwd(), 'arcguard.config.json');
        if (fs_1.default.existsSync(dest) && !opts.force) {
            console.error(`[arcguard] arcguard.config.json already exists. Use --force to overwrite.`);
            process.exit(1);
        }
        const config = (0, loader_1.getDefaultConfig)();
        const content = JSON.stringify(config, null, 2);
        fs_1.default.writeFileSync(dest, content, 'utf-8');
        console.log(`\n✔ Created arcguard.config.json\n`);
        console.log(`  Edit the "rules" section to enable/disable rules.`);
        console.log(`  Run "arcguard check" to validate your project.`);
        console.log(`  Run "arcguard init --mcp" to register the MCP server with Claude Code.\n`);
    });
}
function writeMcpConfig(cwd, force) {
    const claudeDir = path_1.default.join(cwd, '.claude');
    const dest = path_1.default.join(claudeDir, 'mcp.json');
    if (fs_1.default.existsSync(dest) && !force) {
        console.error(`[arcguard] .claude/mcp.json already exists. Use --force to overwrite.`);
        process.exit(1);
    }
    if (!fs_1.default.existsSync(claudeDir))
        fs_1.default.mkdirSync(claudeDir, { recursive: true });
    fs_1.default.writeFileSync(dest, JSON.stringify(MCP_CONFIG, null, 2), 'utf-8');
    console.log(`\n✔ Created .claude/mcp.json\n`);
    console.log(`  Restart Claude Code to load the ArchGuard MCP server.`);
    console.log(`  Run "arcguard analyze" to build the cache before your first session.\n`);
}
//# sourceMappingURL=init.js.map