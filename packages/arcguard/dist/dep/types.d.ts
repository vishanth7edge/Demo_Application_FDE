export interface RegistryData {
    name: string;
    version: string;
    latestVersion: string;
    description: string;
    license: string;
    deprecated: string | null;
    lastPublish: string;
    daysSincePublish: number;
    weeklyDownloads: number;
    maintainerCount: number;
    releasesLastYear: number;
    homepage: string;
    repoUrl: string;
    changelogUrl: string;
}
export interface GitHubStats {
    available: boolean;
    daysSinceLastCommit: number | null;
    openIssues: number | null;
    stars: number | null;
}
export interface VulnEntry {
    id: string;
    ghsa?: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    cvssScore: number | null;
    title: string;
    url: string;
    range: string;
}
export interface SocketScore {
    available: boolean;
    malware: boolean;
    installScripts: boolean;
    obfuscatedCode: boolean;
    protestware: boolean;
    telemetry: boolean;
    score: number;
}
export interface BundleStats {
    available: boolean;
    gzip: number;
    raw: number;
    treeshakeable: boolean;
    dependencyCount: number;
}
export interface DuplicateCandidate {
    name: string;
    category: string;
    fileCount: number;
    importCount: number;
    domains: string[];
}
export interface ProjectAnalysis {
    duplicates: DuplicateCandidate[];
    layerViolation: boolean;
    layerViolationReason: string;
    licenseOk: boolean;
    licenseReason: string;
    alreadyInstalled: boolean;
    currentVersion: string | null;
    installedVersion: string | null;
    usageFiles: string[];
}
export type UpdateType = 'major' | 'minor' | 'patch' | 'none' | 'unknown';
export interface FitBreakdown {
    noDuplicate: boolean;
    noLayerViolation: boolean;
    licenseOk: boolean;
    duplicateNote: string;
}
export interface DependencyScore {
    security: number;
    maintenance: number;
    fit: number;
    total: number;
    fitBreakdown: FitBreakdown;
}
export type VulnPriority = 'used+vulnerable' | 'installed+vulnerable' | 'transitive+vulnerable';
export interface PackageReport {
    name: string;
    resolvedVersion: string;
    registry: RegistryData;
    vulnerabilities: VulnEntry[];
    latestVulnerabilities: VulnEntry[];
    socket: SocketScore;
    bundle: BundleStats;
    project: ProjectAnalysis;
    github: GitHubStats;
    score: DependencyScore;
    verdict: 'ADOPT' | 'REVIEW' | 'REJECT';
    verdictReason: string;
    updateType: UpdateType;
    vulnPriority?: VulnPriority;
}
//# sourceMappingURL=types.d.ts.map