"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Files inside a `services/` directory (or under `application/`) must end
 * with `.service` in the filename, e.g. `user.service.ts` or `UserService.ts`.
 */
const rule = {
    id: 'naming/service-suffix',
    name: 'Service Suffix',
    description: 'Service files must end with ".service" in their name (e.g. user.service.ts).',
    severity: 'warning',
    category: 'naming',
    fixable: true,
    check(context, options) {
        const suffix = options?.suffix ??
            context.config.naming?.serviceSuffix ??
            'service';
        const violations = [];
        for (const file of context.files) {
            if (!['.ts', '.tsx'].includes(file.extension))
                continue;
            const inServicesDir = /[/\\]services[/\\]/.test(file.relativePath);
            const inApplicationLayer = /[/\\]application[/\\]/.test(file.relativePath);
            if (!inServicesDir && !inApplicationLayer)
                continue;
            // Skip index barrels and test files
            if (file.name === 'index' || /\.(test|spec)$/.test(file.name))
                continue;
            const hasSuffix = file.name.toLowerCase().endsWith(`.${suffix}`) ||
                file.name.endsWith(capitalise(suffix)); // e.g. UserService
            if (!hasSuffix) {
                violations.push({
                    ruleId: this.id,
                    ruleName: this.name,
                    severity: this.severity,
                    category: this.category,
                    message: `Service file "${file.name}${file.extension}" must end with ".${suffix}" (e.g. "${file.name}.${suffix}${file.extension}").`,
                    filePath: file.path,
                    relativePath: file.relativePath,
                    suggestion: `Rename to "${file.name}.${suffix}${file.extension}".`,
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
//# sourceMappingURL=service-suffix.js.map