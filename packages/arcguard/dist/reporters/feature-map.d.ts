import { ScanResult, Violation } from '../types';
export type NodeType = 'component' | 'hook' | 'service' | 'context' | 'enum' | 'barrel' | 'test' | 'util';
export type LayerKey = 'presentation' | 'application' | 'domain' | 'infrastructure' | 'unknown';
export interface MapNode {
    id: string;
    label: string;
    type: NodeType;
    layer: LayerKey;
    domain: string | null;
    section: string;
    imports: string[];
    importedBy: string[];
    violations: Array<{
        ruleId: string;
        severity: string;
        message: string;
        suggestion?: string;
    }>;
    lineCount: number;
}
export declare function buildMapData(scanResult: ScanResult, violations: Violation[]): {
    nodes: MapNode[];
    domains: string[];
};
export declare function generateFeatureMap(scanResult: ScanResult, violations: Violation[], projectRoot: string): string;
//# sourceMappingURL=feature-map.d.ts.map