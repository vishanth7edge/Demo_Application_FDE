"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Every exported React component in a .tsx file must have an explicit Props type/interface.
 * Components with no props at all (no parameters) are exempt.
 *
 * Accepts any of:
 *   interface Props { … }
 *   type Props = { … }
 *   interface ButtonProps { … }
 *   FC<ButtonProps>  /  React.FC<Props>
 *   function Foo({ bar }: FooProps)
 */
const rule = {
    id: 'reusability/props-interface-required',
    name: 'Props Interface Required',
    description: 'Exported React components must define an explicit Props type or interface.',
    severity: 'warning',
    category: 'reusability',
    check(context) {
        const violations = [];
        for (const file of context.files) {
            if (file.extension !== '.tsx')
                continue;
            // Skip test / story files
            if (/\.(test|spec|stories)/.test(file.name))
                continue;
            const { content } = file;
            // Does the file export a component at all?
            if (!hasExportedComponent(content))
                continue;
            // Does the file define or use a Props type?
            if (hasPropsDefinition(content))
                continue;
            violations.push({
                ruleId: this.id,
                ruleName: this.name,
                severity: this.severity,
                category: this.category,
                message: `Component file "${file.name}.tsx" has no Props type or interface defined.`,
                filePath: file.path,
                relativePath: file.relativePath,
                suggestion: `Add "interface ${file.name}Props { … }" and type your component parameters.`,
            });
        }
        return violations;
    },
};
function hasExportedComponent(content) {
    // export function/const PascalCase, or export default function
    return (/export\s+(?:default\s+)?(?:function|const)\s+[A-Z]/.test(content) ||
        /export\s+default\s+[A-Z]/.test(content));
}
function hasPropsDefinition(content) {
    return (/interface\s+\w*Props\s*[{<]/.test(content) ||
        /type\s+\w*Props\s*=/.test(content) ||
        // FC<...> or React.FC<...>
        /(?:React\.)?FC\s*</.test(content) ||
        // Destructured props with a type annotation: ({ foo }: FooProps)
        /\(\s*{[^}]*}\s*:\s*\w+Props\s*\)/.test(content) ||
        // Single prop param with type: (props: ButtonProps)
        /\(\s*\w+\s*:\s*\w+Props\s*\)/.test(content));
}
exports.default = rule;
//# sourceMappingURL=props-interface-required.js.map