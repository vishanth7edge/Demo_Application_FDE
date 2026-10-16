"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
/**
 * Each DDD layer folder inside a domain must contain an index.ts barrel file.
 *
 * Example domain: src/domains/user/
 *   ✔ src/domains/user/domain/index.ts
 *   ✔ src/domains/user/application/index.ts
 *   ✗ src/domains/user/presentation/  ← missing index.ts
 */
const LAYER_NAMES = new Set(['domain', 'application', 'infrastructure', 'presentation']);
const rule = {
    id: 'structure/barrel-file',
    name: 'Barrel File Required',
    description: 'Each DDD layer folder inside a domain must have an index.ts barrel file.',
    severity: 'warning',
    category: 'structure',
    check(context, options) {
        const domainsDir = options?.domainsPattern ??
            context.config.ddd?.domainsPattern ??
            'domains';
        // Collect all layer directories that exist in the scanned files
        const layerDirs = new Set();
        const indexFiles = new Set();
        for (const file of context.files) {
            const parts = file.relativePath.split(/[/\\]/);
            const domIdx = parts.indexOf(domainsDir);
            if (domIdx === -1 || parts.length <= domIdx + 2)
                continue;
            const layerFolder = parts[domIdx + 2];
            if (!LAYER_NAMES.has(layerFolder))
                continue;
            // Reconstruct the layer dir relative path
            const layerDir = parts.slice(0, domIdx + 3).join(path_1.default.sep);
            layerDirs.add(layerDir);
            // Check if this file IS the index barrel
            if (parts.length === domIdx + 4 &&
                (file.name === 'index') &&
                ['.ts', '.tsx'].includes(file.extension)) {
                indexFiles.add(layerDir);
            }
        }
        const violations = [];
        for (const layerDir of layerDirs) {
            if (indexFiles.has(layerDir))
                continue;
            // Create a synthetic violation pointing at the directory path
            violations.push({
                ruleId: this.id,
                ruleName: this.name,
                severity: this.severity,
                category: this.category,
                message: `Layer folder "${layerDir}" is missing an index.ts barrel file.`,
                filePath: path_1.default.join(context.projectRoot, layerDir),
                relativePath: layerDir,
                suggestion: `Create "${layerDir}${path_1.default.sep}index.ts" to export the public API of this layer.`,
            });
        }
        return violations;
    },
};
exports.default = rule;
//# sourceMappingURL=barrel-file.js.map