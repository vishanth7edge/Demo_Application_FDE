import type { PackageReport } from './types.js';
export type { PackageReport, VulnEntry, DependencyScore, DuplicateCandidate, UpdateType, VulnPriority } from './types.js';
export { findAllDuplicates } from './analyzer.js';
export declare function checkPackage(packageArg: string, projectRoot: string): Promise<PackageReport>;
export declare function auditAllDeps(projectRoot: string, limit?: number, opts?: {
    dev?: boolean;
    transitive?: boolean;
}): Promise<PackageReport[]>;
//# sourceMappingURL=index.d.ts.map