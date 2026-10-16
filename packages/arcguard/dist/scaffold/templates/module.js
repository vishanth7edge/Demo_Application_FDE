"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleTemplate = moduleTemplate;
function moduleTemplate(name) {
    const layers = ['domain', 'application', 'infrastructure', 'presentation'];
    const files = layers.map(layer => ({
        relativePath: `src/domains/${name}/${layer}/index.ts`,
        content: `// ${layer} layer — ${name} domain\nexport {};\n`,
    }));
    // Root barrel re-exporting all layers
    files.push({
        relativePath: `src/domains/${name}/index.ts`,
        content: layers.map(l => `export * from './${l}';`).join('\n') + '\n',
    });
    return files;
}
//# sourceMappingURL=module.js.map