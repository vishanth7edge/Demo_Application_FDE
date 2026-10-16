export type ScaffoldType = 'component' | 'hook' | 'service' | 'module';
export interface ScaffoldOptions {
    type: ScaffoldType;
    name: string;
    domain?: string;
    outputPath?: string;
    dryRun?: boolean;
    projectRoot: string;
}
export interface ScaffoldResult {
    files: string[];
    dryRun: boolean;
}
export declare function scaffold(opts: ScaffoldOptions): ScaffoldResult;
//# sourceMappingURL=index.d.ts.map