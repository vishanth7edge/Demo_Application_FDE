"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListRules = handleListRules;
const rules_1 = require("../../rules");
function handleListRules(args) {
    const category = typeof args.category === 'string' ? args.category : undefined;
    const rules = category
        ? rules_1.ALL_RULES.filter(r => r.category === category)
        : rules_1.ALL_RULES;
    return rules.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        severity: r.severity,
        category: r.category,
        autofixable: r.fixable ?? false,
    }));
}
//# sourceMappingURL=list-rules.js.map