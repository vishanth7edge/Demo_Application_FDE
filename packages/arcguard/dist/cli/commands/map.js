"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMapCommand = registerMapCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const loader_1 = require("../../config/loader");
const scanner_1 = require("../../scanner");
const engine_1 = require("../../engine");
const rules_1 = require("../../rules");
const feature_map_1 = require("../../reporters/feature-map");
function registerMapCommand(program) {
    program
        .command('map [dir]')
        .description('Generate an interactive feature map of the project architecture')
        .option('--output <path>', 'Output HTML file path', 'arcguard-map.html')
        .option('--open', 'Open in default browser after generating')
        .action(async (dir, opts) => {
        const projectRoot = dir ? path_1.default.resolve(dir) : process.cwd();
        const outPath = path_1.default.resolve(opts.output ?? 'arcguard-map.html');
        console.log(chalk_1.default.dim('\n  Scanning project…'));
        const config = (0, loader_1.loadConfig)(projectRoot);
        const scanResult = await (0, scanner_1.scan)(projectRoot, config);
        const engine = new engine_1.RuleEngine();
        engine.registerAll(rules_1.ALL_RULES);
        const result = engine.run(scanResult, config);
        console.log(chalk_1.default.dim(`  ${scanResult.files.length} files · ${result.violations.length} violations`));
        console.log(chalk_1.default.dim('  Generating feature map…'));
        const html = (0, feature_map_1.generateFeatureMap)(scanResult, result.violations, projectRoot);
        fs_1.default.writeFileSync(outPath, html, 'utf-8');
        console.log(chalk_1.default.green(`\n  Feature map written to: ${outPath}\n`));
        if (opts.open) {
            try {
                const opener = process.platform === 'darwin' ? 'open' :
                    process.platform === 'win32' ? 'start' :
                        'xdg-open';
                (0, child_process_1.execSync)(`${opener} "${outPath}"`, { stdio: 'ignore' });
            }
            catch { /* best-effort */ }
        }
    });
}
//# sourceMappingURL=map.js.map