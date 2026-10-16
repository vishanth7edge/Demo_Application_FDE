import type { ProjectAnalysis, DuplicateCandidate } from './types.js';
export declare function analyzeProject(packageName: string, license: string, projectRoot: string): ProjectAnalysis;
export declare function findAllDuplicates(projectRoot: string): Array<{
    category: string;
    packages: DuplicateCandidate[];
}>;
//# sourceMappingURL=analyzer.d.ts.map