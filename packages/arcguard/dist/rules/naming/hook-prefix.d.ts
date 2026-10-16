import { Rule } from '../../types';
/**
 * Flags hook files whose name does not start with the configured prefix (default "use").
 * Detection heuristic: a .ts/.tsx file is treated as a hook file when
 *   - it lives inside a `hooks/` directory, OR
 *   - it contains `export function use` / `export const use` (exports a hook) but the
 *     filename itself does not start with "use".
 */
declare const rule: Rule;
export default rule;
//# sourceMappingURL=hook-prefix.d.ts.map