"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceTemplate = serviceTemplate;
function serviceTemplate(name) {
    const className = capitalise(name) + 'Service';
    return `export class ${className} {
  // TODO: implement service
}
`;
}
function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
//# sourceMappingURL=service.js.map