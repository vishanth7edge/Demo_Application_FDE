"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
/**
 * Enforces that sub-folders inside a domain only use the allowed DDD layer names.
 * Expected shape:  src/domains/<domain>/{domain,application,infrastructure,presentation,shared}/
 */
const rule = {
    id: 'structure/feature-folder',
    name: 'Feature Folder Structure',
    description: 'Domain folders must only contain recognised DDD layer sub-folders.',
    severity: 'warning',
    category: 'structure',
    check(context, options) {
        const allowed = options?.allowedFolders ??
            context.config.structure?.allowedDomainFolders ??
            ['domain', 'application', 'infrastructure', 'presentation', 'shared'];
        const domainsPattern = options?.domainsPattern ??
            context.config.ddd?.domainsPattern ??
            'domains';
        const violations = [];
        for (const file of context.files) {
            const parts = file.relativePath.split(path_1.default.sep);
            // Find the domain root: segment matching domainsPattern
            const domIdx = parts.findIndex(p => p === domainsPattern);
            if (domIdx === -1 || parts.length <= domIdx + 2)
                continue;
            // parts[domIdx+1] = domain name, parts[domIdx+2] = layer folder
            const layerFolder = parts[domIdx + 2];
            if (!allowed.includes(layerFolder)) {
                violations.push({
                    ruleId: this.id,
                    ruleName: this.name,
                    severity: this.severity,
                    category: this.category,
                    message: `Unexpected folder "${layerFolder}" inside domain "${parts[domIdx + 1]}". Allowed: ${allowed.join(', ')}.`,
                    filePath: file.path,
                    relativePath: file.relativePath,
                    suggestion: `Reorganise into one of: ${allowed.join(', ')}.`,
                });
            }
        }
        return violations;
    },
};
exports.default = rule;
//# sourceMappingURL=feature-folder.js.map