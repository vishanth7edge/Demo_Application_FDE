"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
/**
 * The presentation layer must never import directly from the infrastructure layer.
 * All infrastructure access must flow through the application layer.
 */
const rule = {
    id: 'ddd/no-domain-bypass',
    name: 'No Domain Bypass',
    description: 'Presentation layer must not import directly from infrastructure — route through application.',
    severity: 'error',
    category: 'ddd',
    check(context, options) {
        const violations = [];
        for (const file of context.files) {
            if (!isInLayer(file.relativePath, 'presentation'))
                continue;
            for (const imp of file.imports) {
                if (!path_1.default.isAbsolute(imp))
                    continue;
                const impRelative = path_1.default.relative(context.projectRoot, imp);
                if (isInLayer(impRelative, 'infrastructure')) {
                    violations.push({
                        ruleId: this.id,
                        ruleName: this.name,
                        severity: this.severity,
                        category: this.category,
                        message: `Presentation file imports directly from infrastructure. All infrastructure access must go through the application layer.`,
                        filePath: file.path,
                        relativePath: file.relativePath,
                        suggestion: `Create or use an application-layer service/use-case that wraps the infrastructure call, then import that from presentation.`,
                    });
                }
            }
        }
        return violations;
    },
};
function isInLayer(relativePath, layer) {
    return relativePath.split(/[/\\]/).includes(layer);
}
exports.default = rule;
//# sourceMappingURL=no-domain-bypass.js.map