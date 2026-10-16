"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.mergeConfig = mergeConfig;
exports.getDefaultConfig = getDefaultConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DEFAULT_CONFIG = {
    include: ['src/**/*.{ts,tsx,js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/coverage/**'],
    rules: {
        // Structure
        'structure/no-deep-nesting': 'warning',
        'structure/feature-folder': 'warning',
        // Naming
        'naming/component-pascal-case': 'error',
        'naming/hook-prefix': 'error',
        'naming/service-suffix': 'warning',
        'naming/test-suffix': 'warning',
        // DDD
        'ddd/no-cross-domain': 'error',
        'ddd/layer-dependency': 'error',
        'ddd/no-domain-bypass': 'error',
        'ddd/no-business-logic-in-presentation': 'error',
        // Dependency
        'dependency/no-circular': 'error',
        // Reusability
        'reusability/props-interface-required': 'warning',
        'reusability/no-hardcoded-styles': 'warning',
        'reusability/no-store-in-shared-component': 'error',
        'reusability/max-component-lines': 'warning',
        'reusability/no-duplicate-blocks': 'warning',
        // Naming (Phase 2)
        'naming/constants-upper-case': 'warning',
        'naming/context-suffix': 'warning',
        'naming/enum-pascal-case': 'warning',
        // Structure (Phase 2)
        'structure/barrel-file': 'warning',
    },
    structure: {
        maxDepth: 6,
        featureFolders: true,
        allowedDomainFolders: ['domain', 'application', 'infrastructure', 'presentation', 'shared'],
    },
    naming: {
        componentPattern: 'PascalCase',
        hookPrefix: 'use',
        serviceSuffix: 'service',
        testSuffix: ['.test', '.spec'],
    },
    ddd: {
        domainsPattern: 'domains',
        enforceLayerDependencies: true,
        layers: [
            { name: 'presentation', pattern: 'presentation', allowedDependencies: ['application'] },
            { name: 'application', pattern: 'application', allowedDependencies: ['domain'] },
            { name: 'domain', pattern: 'domain', allowedDependencies: [] },
            { name: 'infrastructure', pattern: 'infrastructure', allowedDependencies: ['domain'] },
        ],
    },
    dependencies: {
        noCircular: true,
    },
    reusability: {
        maxComponentLines: 200,
        sharedDirs: ['shared', 'components', 'ui'],
        storePatterns: ['store', 'stores', 'redux', 'zustand', 'recoil', 'jotai', 'mobx'],
    },
    nx: {
        enabled: true,
        depConstraints: [],
    },
    reporters: ['console'],
};
function loadConfig(cwd) {
    const raw = findConfigFile(cwd);
    if (!raw)
        return DEFAULT_CONFIG;
    return mergeConfig(DEFAULT_CONFIG, raw);
}
function findConfigFile(cwd) {
    const candidates = [
        path_1.default.join(cwd, 'arcguard.config.json'),
        path_1.default.join(cwd, '.arcguardrc.json'),
        path_1.default.join(cwd, '.arcguardrc'),
    ];
    for (const candidate of candidates) {
        if (fs_1.default.existsSync(candidate)) {
            try {
                return JSON.parse(fs_1.default.readFileSync(candidate, 'utf-8'));
            }
            catch {
                console.warn(`[arcguard] Could not parse config at ${candidate}`);
            }
        }
    }
    // Try JS config (dynamic)
    const jsConfig = path_1.default.join(cwd, 'arcguard.config.js');
    if (fs_1.default.existsSync(jsConfig)) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require(jsConfig);
        }
        catch {
            console.warn(`[arcguard] Could not load config at ${jsConfig}`);
        }
    }
    // Try package.json#arcguard
    const pkgPath = path_1.default.join(cwd, 'package.json');
    if (fs_1.default.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf-8'));
            if (pkg.arcguard)
                return pkg.arcguard;
        }
        catch {
            // ignore
        }
    }
    return null;
}
function mergeConfig(base, override) {
    return {
        ...base,
        ...override,
        rules: { ...(base.rules ?? {}), ...(override.rules ?? {}) },
        structure: { ...(base.structure ?? {}), ...(override.structure ?? {}) },
        naming: { ...(base.naming ?? {}), ...(override.naming ?? {}) },
        ddd: { ...(base.ddd ?? {}), ...(override.ddd ?? {}) },
        dependencies: { ...(base.dependencies ?? {}), ...(override.dependencies ?? {}) },
        reusability: { ...(base.reusability ?? {}), ...(override.reusability ?? {}) },
        nx: { ...(base.nx ?? {}), ...(override.nx ?? {}) },
    };
}
function getDefaultConfig() {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}
//# sourceMappingURL=loader.js.map