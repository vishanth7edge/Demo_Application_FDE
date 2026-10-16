import { Rule } from '../../types';
/**
 * Files that create a React Context must have filenames ending with "Context".
 *
 * Flags:  UserState.tsx  (contains createContext but doesn't end with Context)
 * Allows: UserContext.tsx
 */
declare const rule: Rule;
export default rule;
//# sourceMappingURL=context-suffix.d.ts.map