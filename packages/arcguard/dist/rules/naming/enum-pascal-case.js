"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Enum declarations must use PascalCase.
 *
 * Flags:  export enum user_status { ... }
 * Allows: export enum UserStatus { ... }
 */
const PASCAL = /^[A-Z][a-zA-Z0-9]*$/;
const ENUM_RE = /\benum\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
const rule = {
    id: 'naming/enum-pascal-case',
    name: 'Enum PascalCase',
    description: 'Enum declarations must use PascalCase (e.g. UserStatus, not user_status).',
    severity: 'warning',
    category: 'naming',
    check(context) {
        const violations = [];
        for (const file of context.files) {
            if (!['.ts', '.tsx'].includes(file.extension))
                continue;
            if (/\.(test|spec|stories)/.test(file.name))
                continue;
            let m;
            ENUM_RE.lastIndex = 0;
            while ((m = ENUM_RE.exec(file.content)) !== null) {
                const name = m[1];
                if (PASCAL.test(name))
                    continue;
                const lineNo = file.content.slice(0, m.index).split('\n').length;
                violations.push({
                    ruleId: this.id,
                    ruleName: this.name,
                    severity: this.severity,
                    category: this.category,
                    message: `Enum "${name}" must use PascalCase.`,
                    filePath: file.path,
                    relativePath: file.relativePath,
                    line: lineNo,
                    suggestion: `Rename to "${toPascalCase(name)}".`,
                });
            }
        }
        return violations;
    },
};
function toPascalCase(str) {
    return str
        .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, (_, c) => c.toUpperCase());
}
exports.default = rule;
//# sourceMappingURL=enum-pascal-case.js.map