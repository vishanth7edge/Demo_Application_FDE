"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Flags inline style objects in JSX: style={{ ... }}
 * Inline styles prevent theming, design-system overrides, and responsive behaviour.
 */
const rule = {
    id: 'reusability/no-hardcoded-styles',
    name: 'No Hardcoded Inline Styles',
    description: 'JSX elements must not use inline style={{ }} objects. Use CSS classes or a design-system instead.',
    severity: 'warning',
    category: 'reusability',
    check(context) {
        const violations = [];
        // Matches style={{ with any content (possibly multi-line)
        const INLINE_STYLE_RE = /style\s*=\s*\{\s*\{/g;
        for (const file of context.files) {
            if (!['.tsx', '.jsx'].includes(file.extension))
                continue;
            if (/\.(test|spec|stories)/.test(file.name))
                continue;
            let m;
            const seen = new Set();
            while ((m = INLINE_STYLE_RE.exec(file.content)) !== null) {
                const lineNo = file.content.slice(0, m.index).split('\n').length;
                if (seen.has(lineNo))
                    continue;
                seen.add(lineNo);
                violations.push({
                    ruleId: this.id,
                    ruleName: this.name,
                    severity: this.severity,
                    category: this.category,
                    message: `Inline style object found on line ${lineNo}. Move styles to a CSS class or styled component.`,
                    filePath: file.path,
                    relativePath: file.relativePath,
                    line: lineNo,
                    suggestion: `Replace style={{ … }} with a CSS module class or a design-system utility class.`,
                });
            }
        }
        return violations;
    },
};
exports.default = rule;
//# sourceMappingURL=no-hardcoded-styles.js.map