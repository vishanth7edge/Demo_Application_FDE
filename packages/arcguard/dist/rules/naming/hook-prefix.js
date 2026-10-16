"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Flags hook files whose name does not start with the configured prefix (default "use").
 * Detection heuristic: a .ts/.tsx file is treated as a hook file when
 *   - it lives inside a `hooks/` directory, OR
 *   - it contains `export function use` / `export const use` (exports a hook) but the
 *     filename itself does not start with "use".
 */
const rule = {
    id: 'naming/hook-prefix',
    name: 'Hook Prefix',
    description: 'Hook files must start with the configured prefix (default: "use").',
    severity: 'error',
    category: 'naming',
    fixable: true,
    check(context, options) {
        const prefix = options?.prefix ??
            context.config.naming?.hookPrefix ??
            'use';
        const violations = [];
        for (const file of context.files) {
            if (!['.ts', '.tsx'].includes(file.extension))
                continue;
            const inHooksDir = /[/\\]hooks[/\\]/.test(file.relativePath);
            const exportsHook = /export\s+(?:function|const)\s+use[A-Z]/.test(file.content);
            if (!inHooksDir && !exportsHook)
                continue;
            if (!file.name.startsWith(prefix)) {
                violations.push({
                    ruleId: this.id,
                    ruleName: this.name,
                    severity: this.severity,
                    category: this.category,
                    message: `Hook file "${file.name}${file.extension}" must start with "${prefix}".`,
                    filePath: file.path,
                    relativePath: file.relativePath,
                    suggestion: `Rename to "${prefix}${capitalise(file.name)}${file.extension}".`,
                });
            }
        }
        return violations;
    },
};
function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
exports.default = rule;
//# sourceMappingURL=hook-prefix.js.map