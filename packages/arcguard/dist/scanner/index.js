"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scan = scan;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function scan(projectRoot, config) {
    const include = config.include ?? ['src/**/*.{ts,tsx,js,jsx}'];
    const exclude = config.exclude ?? ['**/node_modules/**', '**/dist/**'];
    const files = await collectFiles(projectRoot, include, exclude);
    const dependencyGraph = buildDependencyGraph(files);
    return {
        files,
        dependencyGraph,
        projectRoot,
        scannedAt: new Date().toISOString(),
    };
}
async function collectFiles(root, include, exclude) {
    // Dynamic import to avoid top-level ESM issues
    const { default: fg } = await Promise.resolve().then(() => __importStar(require('fast-glob')));
    const filePaths = await fg(include, {
        cwd: root,
        ignore: exclude,
        absolute: true,
        onlyFiles: true,
    });
    const files = [];
    for (const filePath of filePaths) {
        const relativePath = path_1.default.relative(root, filePath);
        const ext = path_1.default.extname(filePath);
        const name = path_1.default.basename(filePath, ext);
        const segments = relativePath.split(path_1.default.sep);
        const depth = segments.length - 1;
        let content = '';
        try {
            content = fs_1.default.readFileSync(filePath, 'utf-8');
        }
        catch {
            continue;
        }
        const lineCount = content.split('\n').length;
        const imports = parseImports(content, filePath, root);
        const exports = parseExports(content);
        files.push({
            path: filePath,
            relativePath,
            name,
            extension: ext,
            isDirectory: false,
            depth,
            imports,
            exports,
            content,
            lineCount,
        });
    }
    return files;
}
// ── Import parsing ────────────────────────────────────────────────────────────
const EXTENSIONS_TO_TRY = [
    '.ts', '.tsx', '.js', '.jsx',
    '/index.ts', '/index.tsx', '/index.js', '/index.jsx',
];
function parseImports(content, filePath, root) {
    const fileDir = path_1.default.dirname(filePath);
    const raw = new Set();
    // static: import ... from 'x', import 'x', export ... from 'x'
    const staticRe = /(?:import|export)\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g;
    // dynamic: import('x')
    const dynamicRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    // require: require('x')
    const requireRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    for (const re of [staticRe, dynamicRe, requireRe]) {
        let m;
        while ((m = re.exec(content)) !== null) {
            raw.add(m[1]);
        }
    }
    const resolved = [];
    for (const imp of raw) {
        if (imp.startsWith('.')) {
            const abs = resolveRelativeImport(imp, fileDir);
            resolved.push(abs ?? path_1.default.resolve(fileDir, imp));
        }
        else if (imp.startsWith('@/')) {
            // path alias @/ → <root>/src/
            resolved.push(path_1.default.join(root, 'src', imp.slice(2)));
        }
        else {
            // external package — keep as-is so rules can check it
            resolved.push(imp);
        }
    }
    return [...new Set(resolved)];
}
function resolveRelativeImport(imp, fromDir) {
    const base = path_1.default.resolve(fromDir, imp);
    if (fs_1.default.existsSync(base) && fs_1.default.statSync(base).isFile())
        return base;
    for (const ext of EXTENSIONS_TO_TRY) {
        const candidate = base + ext;
        if (fs_1.default.existsSync(candidate))
            return candidate;
    }
    return null;
}
function parseExports(content) {
    const re = /export\s+(?:default\s+)?(?:class|function|const|let|var|type|interface|enum)\s+(\w+)/g;
    const names = [];
    let m;
    while ((m = re.exec(content)) !== null) {
        names.push(m[1]);
    }
    return names;
}
// ── Dependency graph ──────────────────────────────────────────────────────────
function buildDependencyGraph(files) {
    const nodes = new Map();
    const edges = new Map();
    const reverseEdges = new Map();
    for (const file of files) {
        nodes.set(file.path, file);
        edges.set(file.path, new Set());
        reverseEdges.set(file.path, new Set());
    }
    for (const file of files) {
        for (const imp of file.imports) {
            if (!nodes.has(imp))
                continue; // external package or unresolved
            edges.get(file.path).add(imp);
            if (!reverseEdges.has(imp))
                reverseEdges.set(imp, new Set());
            reverseEdges.get(imp).add(file.path);
        }
    }
    return { nodes, edges, reverseEdges };
}
//# sourceMappingURL=index.js.map