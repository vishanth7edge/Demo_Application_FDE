"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetContext = handleGetContext;
const cache_1 = require("../cache");
async function handleGetContext(args, defaultProject) {
    const projectRoot = typeof args.projectRoot === 'string' ? args.projectRoot : defaultProject;
    return (0, cache_1.getOrBuildContext)(projectRoot);
}
//# sourceMappingURL=get-context.js.map