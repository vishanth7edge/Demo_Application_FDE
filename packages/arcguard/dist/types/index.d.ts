export type Severity = 'error' | 'warning' | 'info';
export type RuleCategory = 'structure' | 'naming' | 'ddd' | 'dependency' | 'reusability' | 'imports' | 'nx';
export interface FileNode {
    path: string;
    relativePath: string;
    name: string;
    extension: string;
    isDirectory: boolean;
    depth: number;
    imports: string[];
    exports: string[];
    content: string;
    lineCount: number;
}
export interface DependencyGraph {
    nodes: Map<string, FileNode>;
    edges: Map<string, Set<string>>;
    reverseEdges: Map<string, Set<string>>;
}
export interface Violation {
    ruleId: string;
    ruleName: string;
    severity: Severity;
    category: RuleCategory;
    message: string;
    filePath: string;
    relativePath: string;
    line?: number;
    column?: number;
    suggestion?: string;
}
export interface RuleContext {
    files: FileNode[];
    dependencyGraph: DependencyGraph;
    config: ArchGuardConfig;
    projectRoot: string;
}
export interface Rule {
    id: string;
    name: string;
    description: string;
    severity: Severity;
    category: RuleCategory;
    fixable?: boolean;
    check(context: RuleContext, options?: Record<string, unknown>): Violation[];
}
export interface Plugin {
    name: string;
    version?: string;
    rules: Rule[];
}
/** false = disabled, severity string, or [severity, options] */
export type RuleConfig = false | Severity | [Severity, Record<string, unknown>];
export interface StructureConfig {
    maxDepth?: number;
    featureFolders?: boolean;
    allowedDomainFolders?: string[];
}
export interface NamingConfig {
    componentPattern?: 'PascalCase' | 'camelCase';
    hookPrefix?: string;
    serviceSuffix?: string;
    testSuffix?: string[];
}
export interface DDDLayer {
    name: string;
    pattern: string;
    allowedDependencies: string[];
}
export interface DDDConfig {
    domainsPattern?: string;
    layers?: DDDLayer[];
    enforceLayerDependencies?: boolean;
}
export interface DependencyConfig {
    noCircular?: boolean;
    allowedImports?: Record<string, string[]>;
    forbiddenImports?: Record<string, string[]>;
}
export interface ReusabilityConfig {
    maxComponentLines?: number;
    sharedDirs?: string[];
    storePatterns?: string[];
}
export interface NxDepConstraint {
    sourceTag: string;
    onlyDependOnLibsWithTags: string[];
    notDependOnLibsWithTags?: string[];
}
export interface NxConfig {
    enabled?: boolean;
    workspacePath?: string;
    depConstraints?: NxDepConstraint[];
}
export interface NxProject {
    name: string;
    root: string;
    sourceRoot: string;
    tags: string[];
}
export interface ArchGuardConfig {
    extends?: string[];
    root?: string;
    include?: string[];
    exclude?: string[];
    rules?: Record<string, RuleConfig>;
    plugins?: string[];
    structure?: StructureConfig;
    naming?: NamingConfig;
    ddd?: DDDConfig;
    dependencies?: DependencyConfig;
    reusability?: ReusabilityConfig;
    nx?: NxConfig;
    reporters?: string[];
    outputDir?: string;
}
export interface CategoryScore {
    label: string;
    category: string;
    score: number;
    grade: string;
    errors: number;
    warnings: number;
    violations: number;
}
export interface HealthScore {
    overall: number;
    grade: string;
    categories: CategoryScore[];
    cleanFiles: number;
    totalFiles: number;
}
export interface ReusabilityMetric {
    label: string;
    ruleId: string;
    score: number;
    grade: string;
    compliant: number;
    total: number;
    violations: number;
}
export interface ReusabilityScore {
    overall: number;
    grade: string;
    metrics: ReusabilityMetric[];
}
export interface ScanResult {
    files: FileNode[];
    dependencyGraph: DependencyGraph;
    projectRoot: string;
    scannedAt: string;
}
export interface ViolationSummary {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
    byCategory: Record<string, number>;
    byRule: Record<string, number>;
    filesWithViolations: number;
}
export interface CheckResult {
    violations: Violation[];
    summary: ViolationSummary;
    scanResult: ScanResult;
    duration: number;
    healthScore?: HealthScore;
    reusabilityScore?: ReusabilityScore;
}
//# sourceMappingURL=index.d.ts.map