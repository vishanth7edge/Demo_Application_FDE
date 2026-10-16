import { Rule } from '../../types';
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
declare const rule: Rule;
export default rule;
//# sourceMappingURL=enforce-module-boundaries.d.ts.map