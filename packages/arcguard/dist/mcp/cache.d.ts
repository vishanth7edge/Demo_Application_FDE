import { CheckResult } from '../types';
export interface StructureMap {
    domains: string[];
    sharedComponents: string[];
    layerMap: Record<string, string[]>;
}
export interface ContextData {
    generatedAt: string;
    projectRoot: string;
    healthScore: CheckResult['healthScore'];
    reusabilityScore: CheckResult['reusabilityScore'];
    summary: {
        files: number;
        violations: number;
        errors: number;
        warnings: number;
    };
    structure: StructureMap;
    violations: Array<{
        ruleId: string;
        severity: string;
        file: string;
        line?: number;
        message: string;
        suggestion?: string;
    }>;
}
export declare function readContext(projectRoot: string): ContextData | null;
export declare function isStale(projectRoot: string): boolean;
export declare function buildContext(projectRoot: string): Promise<ContextData>;
export declare function getOrBuildContext(projectRoot: string): Promise<ContextData>;
//# sourceMappingURL=cache.d.ts.map