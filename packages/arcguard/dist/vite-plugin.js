"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arcguardVitePlugin = arcguardVitePlugin;
/* eslint-disable @typescript-eslint/no-explicit-any */
const server_js_1 = require("./runtime/server.js");
/** Vite-compatible plugin object. Typed loosely so vite doesn't need to be an installed dependency. */
function arcguardVitePlugin(options = {}) {
    const port = options.port ?? server_js_1.DEFAULT_RUNTIME_PORT;
    let runtimeServer = null;
    return {
        name: 'arcguard-runtime',
        apply: 'serve',
        configureServer(viteServer) {
            if (options.disabled)
                return;
            runtimeServer = (0, server_js_1.createRuntimeServer)(port, process.cwd());
            viteServer.httpServer?.once('listening', () => {
                console.log(`  \x1b[36m➜\x1b[0m  \x1b[1mArchGuard\x1b[0m  runtime \x1b[36mhttp://localhost:${port}/__arcguard/\x1b[0m`);
            });
        },
        transformIndexHtml() {
            if (options.disabled)
                return [];
            return [
                {
                    tag: 'script',
                    attrs: { src: `http://localhost:${port}/__arcguard/widget.js`, defer: true },
                    injectTo: 'body',
                },
            ];
        },
        closeBundle() {
            runtimeServer?.close();
            runtimeServer = null;
        },
    };
}
//# sourceMappingURL=vite-plugin.js.map