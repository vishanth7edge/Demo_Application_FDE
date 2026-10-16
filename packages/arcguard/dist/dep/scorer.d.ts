import type { VulnEntry, SocketScore, RegistryData, ProjectAnalysis, DependencyScore, PackageReport, GitHubStats } from './types.js';
export declare function computeScore(vulns: VulnEntry[], socket: SocketScore, registry: RegistryData, project: ProjectAnalysis, github: GitHubStats): DependencyScore;
export declare function computeVerdict(score: DependencyScore, vulns: VulnEntry[], socket: SocketScore, registry: RegistryData): {
    verdict: PackageReport['verdict'];
    reason: string;
};
//# sourceMappingURL=scorer.d.ts.map