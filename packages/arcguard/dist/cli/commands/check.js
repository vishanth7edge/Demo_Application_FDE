"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCheckCommand = registerCheckCommand;
const path_1 = __importDefault(require("path"));
const loader_1 = require("../../config/loader");
const scanner_1 = require("../../scanner");
const engine_1 = require("../../engine");
const rules_1 = require("../../rules");
const plugins_1 = require("../../plugins");
const reporters_1 = require("../../reporters");
const nx_1 = require("../../nx");
function registerCheckCommand(program) {
    program
        .command('check [dir]')
        .description('Scan a project and report architecture violations')
        .option('-c, --config <path>', 'Path to arcguard config file')
        .option('--reporter <name>', 'Reporter to use: console, json, sarif (default: console)', 'console')
        .option('--output <path>', 'Output file path for json/sarif reporters')
        .option('--max-warnings <n>', 'Fail if warnings exceed this threshold', parseInt)
        .action(async (dir, opts) => {
        const projectRoot = path_1.default.resolve(dir ?? process.cwd());
        const config = (0, loader_1.loadConfig)(projectRoot);
        if (opts.reporter) {
            config.reporters = [opts.reporter];
        }
        // Build engine with built-in rules
        const engine = new engine_1.RuleEngine();
        engine.registerAll(rules_1.ALL_RULES);
        // Conditionally register Nx rule if workspace is detected
        if (config.nx?.enabled !== false && (0, nx_1.isNxWorkspace)(projectRoot)) {
            const projects = (0, nx_1.readNxWorkspace)(projectRoot);
            if (projects.length > 0) {
                // Inject projects into rule options via a wrapper
                const nxRule = {
                    ...rules_1.enforceModuleBoundaries,
                    check: (ctx) => rules_1.enforceModuleBoundaries.check(ctx, {
                        projects,
                        depConstraints: config.nx?.depConstraints ?? [],
                    }),
                };
                engine.register(nxRule);
                config.rules = {
                    'nx/enforce-module-boundaries': 'error',
                    ...config.rules,
                };
            }
        }
        if (config.plugins?.length) {
            (0, plugins_1.loadPlugins)(config.plugins, projectRoot, engine);
        }
        console.log(`\nScanning ${projectRoot} …`);
        const scanResult = await (0, scanner_1.scan)(projectRoot, config);
        const result = engine.run(scanResult, config);
        (0, reporters_1.runReporters)(result, config.reporters ?? ['console'], projectRoot, opts.output);
        if (result.summary.errors > 0)
            process.exit(1);
        if (opts.maxWarnings !== undefined && result.summary.warnings > opts.maxWarnings) {
            console.error(`\n[arcguard] Exceeded max-warnings threshold (${result.summary.warnings} > ${opts.maxWarnings}).`);
            process.exit(2);
        }
    });
}
//# sourceMappingURL=check.js.map