import { Rule } from '../../types';
/**
 * Presentation layer files (components, pages, hooks) must not contain business logic.
 *
 * Flags three patterns:
 *  1. Direct API calls  — fetch(), axios., XMLHttpRequest  (should live in infrastructure)
 *  2. Direct domain imports — importing from a sibling domain/ folder
 *  3. Non-UI utility functions — exported functions whose names do not follow UI conventions
 *     (use*, handle*, on*, render*) and whose body contains ≥ 3 statements.
 */
declare const rule: Rule;
export default rule;
//# sourceMappingURL=no-business-logic-in-presentation.d.ts.map