"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Exported primitive constants must use SCREAMING_SNAKE_CASE.
 *
 * Flags:  export const apiUrl = 'https://...'
 * Allows: export const API_URL = 'https://...'
 *         export const myObject = { ... }   (non-primitive, ignored)
 *         export const MyComponent = ...    (PascalCase, likely a component)
 */
const SCREAMING = /^[A-Z][A-Z0-9_]*$/;
// Matches: export const <name> = <primitive>
const EXPORT_CONST_RE = /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?::\s*[^=]+)?\s*=\s*(['"`]|true|false|\d)/g;
const rule = {
    id: 'naming/constants-upper-case',
    name: 'Constants Upper Case',
    description: 'Exported primitive constants must use SCREAMING_SNAKE_CASE (e.g. API_URL, MAX_RETRIES).',
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
            EXPORT_CONST_RE.lastIndex = 0;
            while ((m = EXPORT_CONST_RE.exec(file.content)) !== null) {
                const name = m[1];
                // Skip PascalCase (likely a component or class reference)
                if (/^[A-Z]/.test(name) && !/[_]/.test(name))
                    continue;
                if (SCREAMING.test(name))
                    continue;
                const lineNo = file.content.slice(0, m.index).split('\n').length;
                violations.push({
                    ruleId: this.id,
                    ruleName: this.name,
                    severity: this.severity,
                    category: this.category,
                    message: `Exported constant "${name}" should be SCREAMING_SNAKE_CASE.`,
                    filePath: file.path,
                    relativePath: file.relativePath,
                    line: lineNo,
                    suggestion: `Rename to "${toScreaming(name)}".`,
                });
            }
        }
        return violations;
    },
};
function toScreaming(name) {
    return name
        .replace(/([A-Z])/g, '_$1')
        .replace(/[-.]/, '_')
        .toUpperCase()
        .replace(/^_/, '');
}
exports.default = rule;
//# sourceMappingURL=constants-upper-case.js.map