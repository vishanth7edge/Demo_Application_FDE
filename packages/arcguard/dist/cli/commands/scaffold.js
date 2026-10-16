"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerScaffoldCommand = registerScaffoldCommand;
const chalk_1 = __importDefault(require("chalk"));
const scaffold_1 = require("../../scaffold");
const VALID_TYPES = ['component', 'hook', 'service', 'module'];
function registerScaffoldCommand(program) {
    program
        .command('scaffold <type> <name>')
        .description('Generate a DDD-compliant file from a template.\n' +
        '  Types: component, hook, service, module\n' +
        '  Examples:\n' +
        '    arcguard scaffold component UserCard --domain user\n' +
        '    arcguard scaffold module order\n' +
        '    arcguard scaffold hook userData --domain user\n' +
        '    arcguard scaffold service user --domain user')
        .option('--domain <name>', 'Target domain (e.g. user, product)')
        .option('--path <dir>', 'Override output directory')
        .option('--dry-run', 'Print what would be created without writing files')
        .action((type, name, opts) => {
        if (!VALID_TYPES.includes(type)) {
            console.error(chalk_1.default.red(`\n✖ Unknown scaffold type "${type}". Valid types: ${VALID_TYPES.join(', ')}\n`));
            process.exit(1);
        }
        const result = (0, scaffold_1.scaffold)({
            type: type,
            name,
            domain: opts.domain,
            outputPath: opts.path,
            dryRun: opts.dryRun,
            projectRoot: process.cwd(),
        });
        if (result.dryRun) {
            console.log(chalk_1.default.dim('\n[dry-run] Would create:'));
            for (const f of result.files) {
                console.log(chalk_1.default.cyan(`  ${f}`));
            }
            console.log('');
        }
        else {
            console.log(chalk_1.default.green(`\n✔ Scaffolded ${result.files.length} file(s):`));
            for (const f of result.files) {
                console.log(chalk_1.default.cyan(`  ${f}`));
            }
            console.log('');
        }
    });
}
//# sourceMappingURL=scaffold.js.map