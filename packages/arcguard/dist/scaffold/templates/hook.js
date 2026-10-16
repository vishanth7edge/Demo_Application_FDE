"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hookTemplate = hookTemplate;
function hookTemplate(name) {
    // Ensure name starts with "use"
    const hookName = /^use[A-Z]/.test(name) ? name : `use${capitalise(name)}`;
    return `export function ${hookName}() {
  // TODO: implement hook

  return {};
}
`;
}
function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
//# sourceMappingURL=hook.js.map