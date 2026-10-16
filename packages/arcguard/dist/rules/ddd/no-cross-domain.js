"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
/**
 * A file belonging to domain A must not import from domain B.
 * Domains are identified as direct children of the configured domainsPattern directory
 * (default: "domains").  e.g. src/domains/user/ and src/domains/product/ are separate domains.
 */
const rule = {
    id: 'ddd/no-cross-domain',
    name: 'No Cross-Domain Import',
    description: 'A domain must not import from another domain directly.',
    severity: 'error',
    category: 'ddd',
    check(context, options) {
        const domainsDir = options?.domainsPattern ??
            context.config.ddd?.domainsPattern ??
            'domains';
        const violations = [];
        for (const file of context.files) {
            const sourceDomain = extractDomain(file.relativePath, domainsDir);
            if (!sourceDomain)
                continue;
            for (const imp of file.imports) {
                // Only check project-local imports (absolute paths)
                if (!path_1.default.isAbsolute(imp))
                    continue;
                const impRelative = path_1.default.relative(context.projectRoot, imp);
                const targetDomain = extractDomain(impRelative, domainsDir);
                if (targetDomain && targetDomain !== sourceDomain) {
                    violations.push({
                        ruleId: this.id,
                        ruleName: this.name,
                        severity: this.severity,
                        category: this.category,
                        message: `Domain "${sourceDomain}" must not import from domain "${targetDomain}".`,
                        filePath: file.path,
                        relativePath: file.relativePath,
                        suggestion: `Expose a shared interface from "${targetDomain}" via a shared/ module or an anti-corruption layer.`,
                    });
                }
            }
        }
        return violations;
    },
};
/** Returns the domain name if the relative path lives inside domainsDir/<domain>/ */
function extractDomain(relativePath, domainsDir) {
    const parts = relativePath.split(/[/\\]/);
    const idx = parts.indexOf(domainsDir);
    if (idx === -1 || parts.length <= idx + 1)
        return null;
    return parts[idx + 1];
}
exports.default = rule;
//# sourceMappingURL=no-cross-domain.js.map