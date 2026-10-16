"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerListRulesCommand = registerListRulesCommand;
const chalk_1 = __importDefault(require("chalk"));
const rules_1 = require("../../rules");
function registerListRulesCommand(program) {
    program
        .command('list-rules')
        .description('List all built-in rules with their default severity')
        .option('--category <cat>', 'Filter by category (structure|naming|ddd|dependency|reusability)')
        .action((opts) => {
        let rules = rules_1.ALL_RULES;
        if (opts.category) {
            rules = rules.filter(r => r.category === opts.category);
            if (rules.length === 0) {
                console.log(`No rules found for category "${opts.category}".`);
                return;
            }
        }
        // Group by category
        const byCategory = new Map();
        for (const rule of rules) {
            const list = byCategory.get(rule.category) ?? [];
            list.push(rule);
            byCategory.set(rule.category, list);
        }
        console.log('');
        for (const [cat, catRules] of byCategory) {
            console.log(chalk_1.default.bold.underline(cat.toUpperCase()));
            for (const rule of catRules) {
                const sev = severityColour(rule.severity)(rule.severity.padEnd(7));
                const fixable = rule.fixable ? chalk_1.default.green(' [fixable]') : '';
                console.log(`  ${sev}  ${chalk_1.default.cyan(rule.id.padEnd(48))}  ${rule.description}${fixable}`);
            }
            console.log('');
        }
        console.log(chalk_1.default.dim(`${rules.length} rule${rules.length !== 1 ? 's' : ''} total`));
        console.log('');
    });
}
function severityColour(s) {
    if (s === 'error')
        return chalk_1.default.red;
    if (s === 'warning')
        return chalk_1.default.yellow;
    return chalk_1.default.blue;
}
//# sourceMappingURL=list-rules.js.map