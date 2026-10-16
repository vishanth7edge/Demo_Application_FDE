import { NxProject } from '../types';
/**
 * Reads an Nx workspace and returns all discovered projects with their tags.
 * Supports both:
 *   - Older format: workspace.json at root
 *   - Newer format: individual project.json files per project
 */
export declare function readNxWorkspace(projectRoot: string): NxProject[];
/** Returns true if an nx.json exists at the given project root */
export declare function isNxWorkspace(projectRoot: string): boolean;
/** Given an absolute file path, find which NxProject it belongs to */
export declare function resolveNxProject(absoluteFilePath: string, projectRoot: string, projects: NxProject[]): NxProject | null;
//# sourceMappingURL=index.d.ts.map