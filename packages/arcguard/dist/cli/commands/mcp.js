"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMcpCommand = registerMcpCommand;
const path_1 = __importDefault(require("path"));
const mcp_1 = require("../../mcp");
function registerMcpCommand(program) {
    program
        .command('mcp')
        .description('Start the ArchGuard MCP server (stdio transport) for use with Claude Code')
        .option('--project <dir>', 'Project root directory (defaults to cwd)')
        .action(async (opts) => {
        const projectRoot = opts.project ? path_1.default.resolve(opts.project) : process.cwd();
        await (0, mcp_1.startMcpServer)(projectRoot);
    });
}
//# sourceMappingURL=mcp.js.map