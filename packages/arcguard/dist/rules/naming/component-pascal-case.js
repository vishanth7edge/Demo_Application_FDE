"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const SKIP_NAMES = new Set(['index', 'App', 'main', 'vite-env', 'setupTests', 'reportWebVitals']);
const rule = {
    id: 'naming/component-pascal-case',
    name: 'Component PascalCase',
    description: 'React component files (.tsx / .jsx) must use PascalCase file names.',
    severity: 'error',
    category: 'naming',
    fixable: true,
    check(context) {
        const violations = [];
        for (const file of context.files) {
            if (!['.tsx', '.jsx'].includes(file.extension))
                continue;
            if (SKIP_NAMES.has(file.name))
                continue;
            // Skip test / story files
            if (/\.(test|spec|stories)$/.test(file.name))
                continue;
            if (!PASCAL_CASE.test(file.name)) {
                violations.push({
                    ruleId: this.id,
                    ruleName: this.name,
                    severity: this.severity,
                    category: this.category,
                    message: `Component file "${file.name}${file.extension}" must use PascalCase.`,
                    filePath: file.path,
                    relativePath: file.relativePath,
                    suggestion: `Rename to "${toPascalCase(file.name)}${file.extension}".`,
                });
            }
        }
        return violations;
    },
};
function toPascalCase(str) {
    return str
        .replace(/[-_.](.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, (_, c) => c.toUpperCase());
}
exports.default = rule;
//# sourceMappingURL=component-pascal-case.js.map