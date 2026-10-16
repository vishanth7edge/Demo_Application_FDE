"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule = {
    id: 'structure/no-deep-nesting',
    name: 'No Deep Nesting',
    description: 'Prevents folder structures deeper than the configured maxDepth.',
    severity: 'warning',
    category: 'structure',
    check(context, options) {
        const maxDepth = options?.maxDepth ??
            context.config.structure?.maxDepth ??
            6;
        return context.files
            .filter(f => f.depth > maxDepth)
            .map(f => ({
            ruleId: this.id,
            ruleName: this.name,
            severity: this.severity,
            category: this.category,
            message: `File is nested ${f.depth} levels deep (max allowed: ${maxDepth}).`,
            filePath: f.path,
            relativePath: f.relativePath,
            suggestion: `Move the file to a shallower directory (≤ ${maxDepth} levels).`,
        }));
    },
};
exports.default = rule;
//# sourceMappingURL=no-deep-nesting.js.map