"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Shared / common UI components must not import from a state-management store.
 * A component coupled to a specific store cannot be moved to a shared library or reused
 * across different parts of the app.
 *
 * "Shared" means the file lives under one of the configured sharedDirs (default: shared, components, ui).
 * "Store" imports are detected by matching the import path against storePatterns.
 */
const rule = {
    id: 'reusability/no-store-in-shared-component',
    name: 'No Store Access in Shared Component',
    description: 'Shared UI components must not import from state-management stores (Redux, Zustand, etc.).',
    severity: 'error',
    category: 'reusability',
    check(context, options) {
        const sharedDirs = options?.sharedDirs ??
            context.config.reusability?.sharedDirs ??
            ['shared', 'components', 'ui'];
        const storePatterns = options?.storePatterns ??
            context.config.reusability?.storePatterns ??
            ['store', 'stores', 'redux', 'zustand', 'recoil', 'jotai', 'mobx'];
        const violations = [];
        for (const file of context.files) {
            if (!['.tsx', '.jsx', '.ts'].includes(file.extension))
                continue;
            if (!isInSharedDir(file.relativePath, sharedDirs))
                continue;
            for (const imp of file.imports) {
                const storeMatch = matchesStorePattern(imp, storePatterns);
                if (!storeMatch)
                    continue;
                violations.push({
                    ruleId: this.id,
                    ruleName: this.name,
                    severity: this.severity,
                    category: this.category,
                    message: `Shared component "${file.name}${file.extension}" imports from store "${storeMatch}". Shared components must be store-agnostic.`,
                    filePath: file.path,
                    relativePath: file.relativePath,
                    suggestion: `Pass store data as props instead of accessing the store directly. This keeps the component reusable and independently testable.`,
                });
            }
        }
        return violations;
    },
};
function isInSharedDir(relativePath, sharedDirs) {
    const parts = relativePath.split(/[/\\]/);
    return parts.some(p => sharedDirs.includes(p));
}
function matchesStorePattern(imp, patterns) {
    const lower = imp.toLowerCase();
    for (const p of patterns) {
        if (lower.includes(p))
            return p;
    }
    return null;
}
exports.default = rule;
//# sourceMappingURL=no-store-in-shared-component.js.map