"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Files inside __tests__/ directories or with "test"/"spec" anywhere in their path
 * must end with a recognised test suffix (.test.ts, .spec.ts, etc.).
 */
const rule = {
    id: 'naming/test-suffix',
    name: 'Test File Suffix',
    description: 'Test files must use a recognised suffix: .test.ts, .spec.ts (or .js variants).',
    severity: 'warning',
    category: 'naming',
    fixable: true,
    check(context, options) {
        const suffixes = options?.suffixes ??
            context.config.naming?.testSuffix ??
            ['.test', '.spec'];
        const violations = [];
        for (const file of context.files) {
            const inTestDir = /__tests__/.test(file.relativePath) || /[/\\]tests?[/\\]/.test(file.relativePath);
            if (!inTestDir)
                continue;
            // Already has a recognised suffix?
            const hasSuffix = suffixes.some(s => file.name.endsWith(s));
            if (hasSuffix)
                continue;
            violations.push({
                ruleId: this.id,
                ruleName: this.name,
                severity: this.severity,
                category: this.category,
                message: `Test file "${file.name}${file.extension}" should end with one of: ${suffixes.map(s => s + file.extension).join(', ')}.`,
                filePath: file.path,
                relativePath: file.relativePath,
                suggestion: `Rename to "${file.name}${suffixes[0]}${file.extension}".`,
            });
        }
        return violations;
    },
};
exports.default = rule;
//# sourceMappingURL=test-suffix.js.map