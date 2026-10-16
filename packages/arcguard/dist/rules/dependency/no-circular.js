"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Detects circular import chains anywhere in the project using iterative DFS.
 * Reports one violation per unique cycle (normalised by smallest-path-first rotation).
 */
const rule = {
    id: 'dependency/no-circular',
    name: 'No Circular Dependencies',
    description: 'Detects circular import chains that create tight coupling.',
    severity: 'error',
    category: 'dependency',
    check(context) {
        const { edges, nodes } = context.dependencyGraph;
        const violations = [];
        const reportedCycles = new Set();
        for (const startNode of nodes.keys()) {
            const cycle = findCycle(startNode, edges);
            if (!cycle)
                continue;
            const key = canonicalCycleKey(cycle);
            if (reportedCycles.has(key))
                continue;
            reportedCycles.add(key);
            const relPaths = cycle.map(p => {
                const n = nodes.get(p);
                return n ? n.relativePath : p;
            });
            // Report on the first file in the cycle
            const file = nodes.get(cycle[0]);
            if (!file)
                continue;
            violations.push({
                ruleId: this.id,
                ruleName: this.name,
                severity: this.severity,
                category: this.category,
                message: `Circular dependency detected: ${relPaths.join(' → ')} → ${relPaths[0]}`,
                filePath: file.path,
                relativePath: file.relativePath,
                suggestion: `Break the cycle by extracting shared logic into a new module that neither side imports.`,
            });
        }
        return violations;
    },
};
// ── DFS cycle detection ───────────────────────────────────────────────────────
function findCycle(start, edges) {
    const visited = new Set();
    const stack = [];
    const stackSet = new Set();
    function dfs(node) {
        if (stackSet.has(node)) {
            // Found a cycle — extract the cycle portion
            const idx = stack.indexOf(node);
            return stack.slice(idx);
        }
        if (visited.has(node))
            return null;
        visited.add(node);
        stack.push(node);
        stackSet.add(node);
        for (const neighbour of edges.get(node) ?? []) {
            const cycle = dfs(neighbour);
            if (cycle)
                return cycle;
        }
        stack.pop();
        stackSet.delete(node);
        return null;
    }
    return dfs(start);
}
/** Rotate cycle so the lexicographically smallest path is first → stable dedup key */
function canonicalCycleKey(cycle) {
    let minIdx = 0;
    for (let i = 1; i < cycle.length; i++) {
        if (cycle[i] < cycle[minIdx])
            minIdx = i;
    }
    const rotated = [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
    return rotated.join('|');
}
exports.default = rule;
//# sourceMappingURL=no-circular.js.map