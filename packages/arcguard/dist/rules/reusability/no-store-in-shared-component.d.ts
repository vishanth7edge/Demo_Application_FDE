import { Rule } from '../../types';
/**
 * Shared / common UI components must not import from a state-management store.
 * A component coupled to a specific store cannot be moved to a shared library or reused
 * across different parts of the app.
 *
 * "Shared" means the file lives under one of the configured sharedDirs (default: shared, components, ui).
 * "Store" imports are detected by matching the import path against storePatterns.
 */
declare const rule: Rule;
export default rule;
//# sourceMappingURL=no-store-in-shared-component.d.ts.map