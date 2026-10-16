"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDevCommand = registerDevCommand;
const path_1 = __importDefault(require("path"));
const server_js_1 = require("../../runtime/server.js");
function registerDevCommand(program) {
    program
        .command('dev [dir]')
        .description('Start the ArchGuard runtime debugging server. ' +
        'Exposes a widget script and event-capture API so Claude can query live console errors and network failures from your browser.')
        .option('-p, --port <number>', 'Port to listen on', String(server_js_1.DEFAULT_RUNTIME_PORT))
        .action((dir, opts) => {
        const projectRoot = dir ? path_1.default.resolve(dir) : process.cwd();
        const port = parseInt(opts.port, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            console.error(`Invalid port: ${opts.port}`);
            process.exit(1);
        }
        const server = (0, server_js_1.createRuntimeServer)(port, projectRoot);
        console.log('');
        console.log('  \x1b[1m\x1b[36mArchGuard\x1b[0m Runtime Debugging Server');
        console.log('');
        console.log(`  Widget URL:   http://localhost:${port}/__arcguard/widget.js`);
        console.log(`  Snapshot:     http://localhost:${port}/__arcguard/snapshot`);
        console.log(`  Events (SSE): http://localhost:${port}/__arcguard/events`);
        console.log('');
        console.log('  Add to your HTML to start capturing:');
        console.log(`  \x1b[2m<script src="http://localhost:${port}/__arcguard/widget.js" defer></script>\x1b[0m`);
        console.log('');
        console.log('  Or use the Vite plugin — see docs for \x1b[1marcguardVitePlugin()\x1b[0m.');
        console.log('');
        console.log('  \x1b[2mPress Ctrl+C to stop.\x1b[0m');
        process.on('SIGINT', () => {
            server.close();
            console.log('\n  ArchGuard runtime server stopped.');
            process.exit(0);
        });
        process.on('SIGTERM', () => { server.close(); process.exit(0); });
    });
}
//# sourceMappingURL=dev.js.map