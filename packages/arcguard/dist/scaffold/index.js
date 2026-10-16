"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaffold = scaffold;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const component_1 = require("./templates/component");
const hook_1 = require("./templates/hook");
const service_1 = require("./templates/service");
const module_1 = require("./templates/module");
function scaffold(opts) {
    const { type, name, domain, outputPath, dryRun = false, projectRoot } = opts;
    const filesToWrite = resolveFiles(type, name, domain, outputPath, projectRoot);
    const writtenPaths = [];
    for (const { absPath, content } of filesToWrite) {
        writtenPaths.push(absPath);
        if (dryRun)
            continue;
        const dir = path_1.default.dirname(absPath);
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        if (fs_1.default.existsSync(absPath)) {
            console.warn(`[arcguard] Skipping "${absPath}" — file already exists.`);
            continue;
        }
        fs_1.default.writeFileSync(absPath, content, 'utf-8');
    }
    return { files: writtenPaths, dryRun };
}
// ── Path + content resolution ─────────────────────────────────────────────────
function resolveFiles(type, name, domain, outputPath, projectRoot) {
    switch (type) {
        case 'component': {
            const pascal = toPascalCase(name);
            const dir = outputPath
                ? path_1.default.resolve(projectRoot, outputPath)
                : domain
                    ? path_1.default.join(projectRoot, 'src', 'domains', domain, 'presentation')
                    : path_1.default.join(projectRoot, 'src', 'components');
            return [{ absPath: path_1.default.join(dir, `${pascal}.tsx`), content: (0, component_1.componentTemplate)(pascal) }];
        }
        case 'hook': {
            const hookName = /^use[A-Z]/.test(name) ? name : `use${toPascalCase(name)}`;
            const dir = outputPath
                ? path_1.default.resolve(projectRoot, outputPath)
                : domain
                    ? path_1.default.join(projectRoot, 'src', 'domains', domain, 'presentation')
                    : path_1.default.join(projectRoot, 'src', 'hooks');
            return [{ absPath: path_1.default.join(dir, `${hookName}.ts`), content: (0, hook_1.hookTemplate)(name) }];
        }
        case 'service': {
            const lower = name.toLowerCase();
            const dir = outputPath
                ? path_1.default.resolve(projectRoot, outputPath)
                : domain
                    ? path_1.default.join(projectRoot, 'src', 'domains', domain, 'application')
                    : path_1.default.join(projectRoot, 'src', 'services');
            return [{ absPath: path_1.default.join(dir, `${lower}.service.ts`), content: (0, service_1.serviceTemplate)(name) }];
        }
        case 'module': {
            const lower = name.toLowerCase();
            const moduleFiles = (0, module_1.moduleTemplate)(lower);
            return moduleFiles.map(f => ({
                absPath: path_1.default.join(projectRoot, f.relativePath),
                content: f.content,
            }));
        }
    }
}
function toPascalCase(str) {
    return str
        .replace(/[-_.](.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, (_, c) => c.toUpperCase());
}
//# sourceMappingURL=index.js.map