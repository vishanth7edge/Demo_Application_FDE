"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleScaffold = handleScaffold;
const scaffold_1 = require("../../scaffold");
const VALID_TYPES = ['component', 'hook', 'service', 'module'];
function handleScaffold(args, defaultProject) {
    const projectRoot = typeof args.projectRoot === 'string' ? args.projectRoot : defaultProject;
    const type = args.type;
    const name = typeof args.name === 'string' ? args.name : '';
    if (!VALID_TYPES.includes(type)) {
        throw new Error(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }
    if (!name)
        throw new Error('name is required');
    const opts = {
        type,
        name,
        projectRoot,
        domain: typeof args.domain === 'string' ? args.domain : undefined,
        dryRun: args.dryRun === true,
    };
    return (0, scaffold_1.scaffold)(opts);
}
//# sourceMappingURL=scaffold-tool.js.map