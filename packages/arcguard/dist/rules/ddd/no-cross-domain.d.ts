import { Rule } from '../../types';
/**
 * A file belonging to domain A must not import from domain B.
 * Domains are identified as direct children of the configured domainsPattern directory
 * (default: "domains").  e.g. src/domains/user/ and src/domains/product/ are separate domains.
 */
declare const rule: Rule;
export default rule;
//# sourceMappingURL=no-cross-domain.d.ts.map