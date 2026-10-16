"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Component files exceeding the configured line threshold are too large to be
 * easily reused and should be broken into smaller, focused components.
 */
const rule = {
    id: 'reusability/max-component-lines',
    name: 'Max Component Lines',
    description: 'Component files must not exceed the configured line count (default: 200).',
    severity: 'warning',
    category: 'reusability',
    check(context, options) {
        const maxLines = options?.maxLines ??
            context.config.reusability?.maxComponentLines ??
            200;
        const violations = [];
        for (const file of context.files) {
            if (!['.tsx', '.jsx'].includes(file.extension))
                continue;
            if (/\.(test|spec|stories)/.test(file.name))
                continue;
            if (file.lineCount > maxLines) {
                violations.push({
                    ruleId: this.id,
                    ruleName: this.name,
                    severity: this.severity,
                    category: this.category,
                    message: `Component "${file.name}${file.extension}" has ${file.lineCount} lines (max: ${maxLines}). Large components are hard to reuse and test.`,
                    filePath: file.path,
                    relativePath: file.relativePath,
                    suggestion: `Extract sub-components, custom hooks, or utility functions until the file is under ${maxLines} lines.`,
                });
            }
        }
        return violations;
    },
};
exports.default = rule;
//# sourceMappingURL=max-component-lines.js.map