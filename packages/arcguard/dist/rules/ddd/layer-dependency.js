"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
/**
 * Enforces the DDD layer dependency rule:
 *   presentation  →  application  →  domain
 *   infrastructure               →  domain
 *
 * "domain" must have zero outward dependencies to other layers.
 * "application" must not depend on "presentation".
 * "presentation" must not depend on "infrastructure" (covered by no-domain-bypass).
 */
// Higher rank = lower in the stack (fewer allowed dependencies)
const LAYER_RANK = {
    presentation: 3,
    application: 2,
    infrastructure: 2,
    domain: 1,
};
// What each layer is NOT allowed to import
const FORBIDDEN = {
    domain: ['application', 'presentation', 'infrastructure'],
    application: ['presentation'],
    infrastructure: ['application', 'presentation'],
    // presentation can import application (but not infrastructure — see no-domain-bypass)
};
const rule = {
    id: 'ddd/layer-dependency',
    name: 'DDD Layer Dependency',
    description: 'Enforces correct DDD layer dependency direction: presentation→application→domain.',
    severity: 'error',
    category: 'ddd',
    check(context, options) {
        const domainsDir = options?.domainsPattern ??
            context.config.ddd?.domainsPattern ??
            'domains';
        const violations = [];
        for (const file of context.files) {
            const sourceLayer = extractLayer(file.relativePath);
            if (!sourceLayer || !FORBIDDEN[sourceLayer])
                continue;
            const forbidden = FORBIDDEN[sourceLayer];
            for (const imp of file.imports) {
                if (!path_1.default.isAbsolute(imp))
                    continue;
                const impRelative = path_1.default.relative(context.projectRoot, imp);
                const targetLayer = extractLayer(impRelative);
                if (!targetLayer)
                    continue;
                // Only flag within the same domain or across domains
                if (forbidden.includes(targetLayer)) {
                    violations.push({
                        ruleId: this.id,
                        ruleName: this.name,
                        severity: this.severity,
                        category: this.category,
                        message: `Layer "${sourceLayer}" must not import from layer "${targetLayer}".`,
                        filePath: file.path,
                        relativePath: file.relativePath,
                        suggestion: layerSuggestion(sourceLayer, targetLayer),
                    });
                }
            }
        }
        return violations;
    },
};
function extractLayer(relativePath) {
    const layers = Object.keys(LAYER_RANK);
    const parts = relativePath.split(/[/\\]/);
    for (const part of parts) {
        if (layers.includes(part))
            return part;
    }
    return null;
}
function layerSuggestion(source, target) {
    if (source === 'domain') {
        return `The domain layer must be pure. Move this dependency to the application or infrastructure layer.`;
    }
    if (source === 'application' && target === 'presentation') {
        return `application must not depend on presentation. Invert the dependency using an interface or event.`;
    }
    return `Move the shared logic to a lower layer that both "${source}" and "${target}" can depend on.`;
}
exports.default = rule;
//# sourceMappingURL=layer-dependency.js.map