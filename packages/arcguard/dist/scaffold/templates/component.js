"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentTemplate = componentTemplate;
function componentTemplate(name) {
    return `interface ${name}Props {
  // TODO: define props
}

export function ${name}({ }: ${name}Props) {
  return (
    <div>
      {/* TODO */}
    </div>
  );
}

export default ${name};
`;
}
//# sourceMappingURL=component.js.map