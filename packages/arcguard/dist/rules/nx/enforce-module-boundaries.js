"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const nx_1 = require("../../nx");
/**
 * Enforces Nx tag-based module boundary constraints.
 *
 * Configure in arcguard.config.json:
 * {
 *   "nx": {
 *     "depConstraints": [
 *       { "sourceTag": "type:feature", "onlyDependOnLibsWithTags": ["type:feature", "type:ui", "type:util"] },
 *       { "sourceTag": "type:ui",      "onlyDependOnLibsWithTags": ["type:ui", "type:util"] }
 *     ]
 *   }
 * }
 *
 * The rule receives the resolved NxProject list via options.projects (injected by check.ts).
 */
const rule = {
    id: 'nx/enforce-module-boundaries',
    name: 'Enforce Nx Module Boundaries',
    description: 'Enforces tag-based dependency constraints between Nx projects.',
    severity: 'error',
    category: 'nx',
    check(context, options) {
        const projects = options?.projects ?? [];
        const constraints = options?.depConstraints ??
            context.config.nx?.depConstraints ??
            [];
        if (projects.length === 0 || constraints.length === 0)
            return [];
        const violations = [];
        for (const file of context.files) {
            const sourceProject = (0, nx_1.resolveNxProject)(file.path, context.projectRoot, projects);
            if (!sourceProject)
                continue;
            for (const imp of file.imports) {
                if (!path_1.default.isAbsolute(imp))
                    continue;
                const targetProject = (0, nx_1.resolveNxProject)(imp, context.projectRoot, projects);
                if (!targetProject || targetProject.name === sourceProject.name)
                    continue;
                // Check each constraint that applies to a tag on the source project
                for (const constraint of constraints) {
                    if (!sourceProject.tags.includes(constraint.sourceTag))
                        continue;
                    // onlyDependOnLibsWithTags — target must have at least one of these
                    if (constraint.onlyDependOnLibsWithTags.length > 0) {
                        const allowed = constraint.onlyDependOnLibsWithTags.some(t => targetProject.tags.includes(t));
                        if (!allowed) {
                            violations.push(makeViolation(file, sourceProject, targetProject, constraint, this));
                        }
                    }
                    // notDependOnLibsWithTags — target must not have any of these
                    if (constraint.notDependOnLibsWithTags?.length) {
                        const forbidden = constraint.notDependOnLibsWithTags.some(t => targetProject.tags.includes(t));
                        if (forbidden) {
                            violations.push(makeViolation(file, sourceProject, targetProject, constraint, this));
                        }
                    }
                }
            }
        }
        return violations;
    },
};
function makeViolation(file, source, target, constraint, r) {
    return {
        ruleId: r.id,
        ruleName: r.name,
        severity: r.severity,
        category: r.category,
        message: `Project "${source.name}" [${source.tags.join(', ')}] must not depend on "${target.name}" [${target.tags.join(', ')}] — violates constraint for tag "${constraint.sourceTag}".`,
        filePath: file.path,
        relativePath: file.relativePath,
        suggestion: `Move shared logic into a library with allowed tags, or update depConstraints in arcguard.config.json.`,
    };
}
exports.default = rule;
//# sourceMappingURL=enforce-module-boundaries.js.map