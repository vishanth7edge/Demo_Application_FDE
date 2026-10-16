"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readNxWorkspace = readNxWorkspace;
exports.isNxWorkspace = isNxWorkspace;
exports.resolveNxProject = resolveNxProject;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Reads an Nx workspace and returns all discovered projects with their tags.
 * Supports both:
 *   - Older format: workspace.json at root
 *   - Newer format: individual project.json files per project
 */
function readNxWorkspace(projectRoot) {
    const nxJsonPath = path_1.default.join(projectRoot, 'nx.json');
    if (!fs_1.default.existsSync(nxJsonPath))
        return [];
    const projects = [];
    // Try workspace.json (older Nx format)
    const workspaceJsonPath = path_1.default.join(projectRoot, 'workspace.json');
    if (fs_1.default.existsSync(workspaceJsonPath)) {
        const ws = readJson(workspaceJsonPath);
        if (ws?.projects) {
            for (const [name, entry] of Object.entries(ws.projects)) {
                const projectRoot_ = typeof entry === 'string' ? entry : entry.root;
                const tags = typeof entry === 'string' ? [] : (entry.tags ?? []);
                const sourceRoot = typeof entry === 'string'
                    ? path_1.default.join(entry, 'src')
                    : (entry.sourceRoot ?? path_1.default.join(entry.root, 'src'));
                projects.push({ name, root: projectRoot_, sourceRoot, tags });
            }
        }
    }
    // Scan for individual project.json files (newer Nx format)
    if (projects.length === 0) {
        const projectJsonPaths = findProjectJsonFiles(projectRoot);
        for (const pjPath of projectJsonPaths) {
            const pj = readJson(pjPath);
            if (!pj)
                continue;
            const relRoot = path_1.default.relative(projectRoot, path_1.default.dirname(pjPath));
            const name = pj.name ?? relRoot.replace(/[/\\]/g, '-');
            const sourceRoot = pj.sourceRoot ?? path_1.default.join(relRoot, 'src');
            const tags = pj.tags ?? [];
            projects.push({ name, root: relRoot, sourceRoot, tags });
        }
    }
    return projects;
}
/** Returns true if an nx.json exists at the given project root */
function isNxWorkspace(projectRoot) {
    return fs_1.default.existsSync(path_1.default.join(projectRoot, 'nx.json'));
}
/** Given an absolute file path, find which NxProject it belongs to */
function resolveNxProject(absoluteFilePath, projectRoot, projects) {
    const rel = path_1.default.relative(projectRoot, absoluteFilePath).replace(/\\/g, '/');
    // Find the project whose sourceRoot is the longest prefix of rel
    let best = null;
    let bestLen = -1;
    for (const p of projects) {
        const sr = p.sourceRoot.replace(/\\/g, '/');
        if (rel.startsWith(sr + '/') || rel === sr) {
            if (sr.length > bestLen) {
                best = p;
                bestLen = sr.length;
            }
        }
    }
    return best;
}
// ── Internal helpers ──────────────────────────────────────────────────────────
function readJson(filePath) {
    try {
        return JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
    }
    catch {
        return null;
    }
}
function findProjectJsonFiles(root, depth = 0) {
    if (depth > 6)
        return [];
    const results = [];
    let entries;
    try {
        entries = fs_1.default.readdirSync(root, { withFileTypes: true });
    }
    catch {
        return [];
    }
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git')
            continue;
        const full = path_1.default.join(root, entry.name);
        if (entry.isDirectory()) {
            results.push(...findProjectJsonFiles(full, depth + 1));
        }
        else if (entry.name === 'project.json') {
            results.push(full);
        }
    }
    return results;
}
//# sourceMappingURL=index.js.map