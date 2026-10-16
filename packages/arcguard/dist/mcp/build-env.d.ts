export interface BundlerInfo {
    tool: 'vite' | 'webpack' | 'next' | 'cra' | 'parcel' | 'esbuild' | 'turbopack' | 'rspack' | 'unknown' | null;
    configFile: string | null;
    sourceMapsEnabled: boolean | null;
}
export interface EntryPoint {
    htmlFile: string;
    scriptSrc: string;
}
export interface DependencyRisk {
    name: string;
    version: string;
    reason: 'heavy-bundle' | 'deprecated' | 'risky' | 'peer-conflict';
    detail: string;
}
export interface LargeAsset {
    path: string;
    sizeKb: number;
}
export interface ServingConfigEntry {
    file: string;
    compression: boolean | null;
    cacheControl: boolean | null;
    staticDir: string | null;
}
export interface BuildEnv {
    bundler: BundlerInfo;
    buildScripts: Record<string, string>;
    entryPoints: EntryPoint[];
    dependencyRisks: DependencyRisk[];
    staticAssets: {
        publicDir: string | null;
        largeFiles: LargeAsset[];
    };
    servingConfig: ServingConfigEntry[];
}
export declare function detectBuildEnv(projectRoot: string): BuildEnv;
//# sourceMappingURL=build-env.d.ts.map