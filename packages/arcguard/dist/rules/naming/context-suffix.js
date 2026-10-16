"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Files that create a React Context must have filenames ending with "Context".
 *
 * Flags:  UserState.tsx  (contains createContext but doesn't end with Context)
 * Allows: UserContext.tsx
 */
const rule = {
    id: 'naming/context-suffix',
    name: 'Context File Suffix',
    description: 'Files that create a React Context must have filenames ending with "Context".',
    severity: 'warning',
    category: 'naming',
    fixable: true,
    check(context) {
        const violations = [];
        const CREATE_CONTEXT_RE = /\bcreateContext\s*[(<]/;
        for (const file of context.files) {
            if (!['.ts', '.tsx'].includes(file.extension))
                continue;
            if (/\.(test|spec|stories)/.test(file.name))
                continue;
            if (!CREATE_CONTEXT_RE.test(file.content))
                continue;
            if (file.name.endsWith('Context'))
                continue;
            violations.push({
                ruleId: this.id,
                ruleName: this.name,
                severity: this.severity,
                category: this.category,
                message: `File "${file.name}${file.extension}" creates a React Context but doesn't end with "Context".`,
                filePath: file.path,
                relativePath: file.relativePath,
                suggestion: `Rename to "${file.name}Context${file.extension}".`,
            });
        }
        return violations;
    },
};
exports.default = rule;
//# sourceMappingURL=context-suffix.js.map