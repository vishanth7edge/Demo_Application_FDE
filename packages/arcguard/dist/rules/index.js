"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noDuplicateBlocks = exports.maxComponentLines = exports.noStoreInSharedComponent = exports.noHardcodedStyles = exports.propsInterfaceRequired = exports.noCircular = exports.noBusinessLogicInPresentation = exports.noDomainBypass = exports.layerDependency = exports.noCrossDomain = exports.enumPascalCase = exports.contextSuffix = exports.constantsUpperCase = exports.testSuffix = exports.serviceSuffix = exports.hookPrefix = exports.componentPascalCase = exports.barrelFile = exports.featureFolder = exports.noDeepNesting = exports.ALL_RULES = exports.enforceModuleBoundaries = void 0;
// Structure
const no_deep_nesting_1 = __importDefault(require("./structure/no-deep-nesting"));
exports.noDeepNesting = no_deep_nesting_1.default;
const feature_folder_1 = __importDefault(require("./structure/feature-folder"));
exports.featureFolder = feature_folder_1.default;
const barrel_file_1 = __importDefault(require("./structure/barrel-file"));
exports.barrelFile = barrel_file_1.default;
// Naming
const component_pascal_case_1 = __importDefault(require("./naming/component-pascal-case"));
exports.componentPascalCase = component_pascal_case_1.default;
const hook_prefix_1 = __importDefault(require("./naming/hook-prefix"));
exports.hookPrefix = hook_prefix_1.default;
const service_suffix_1 = __importDefault(require("./naming/service-suffix"));
exports.serviceSuffix = service_suffix_1.default;
const test_suffix_1 = __importDefault(require("./naming/test-suffix"));
exports.testSuffix = test_suffix_1.default;
const constants_upper_case_1 = __importDefault(require("./naming/constants-upper-case"));
exports.constantsUpperCase = constants_upper_case_1.default;
const context_suffix_1 = __importDefault(require("./naming/context-suffix"));
exports.contextSuffix = context_suffix_1.default;
const enum_pascal_case_1 = __importDefault(require("./naming/enum-pascal-case"));
exports.enumPascalCase = enum_pascal_case_1.default;
// DDD
const no_cross_domain_1 = __importDefault(require("./ddd/no-cross-domain"));
exports.noCrossDomain = no_cross_domain_1.default;
const layer_dependency_1 = __importDefault(require("./ddd/layer-dependency"));
exports.layerDependency = layer_dependency_1.default;
const no_domain_bypass_1 = __importDefault(require("./ddd/no-domain-bypass"));
exports.noDomainBypass = no_domain_bypass_1.default;
const no_business_logic_in_presentation_1 = __importDefault(require("./ddd/no-business-logic-in-presentation"));
exports.noBusinessLogicInPresentation = no_business_logic_in_presentation_1.default;
// Dependency
const no_circular_1 = __importDefault(require("./dependency/no-circular"));
exports.noCircular = no_circular_1.default;
// Reusability
const props_interface_required_1 = __importDefault(require("./reusability/props-interface-required"));
exports.propsInterfaceRequired = props_interface_required_1.default;
const no_hardcoded_styles_1 = __importDefault(require("./reusability/no-hardcoded-styles"));
exports.noHardcodedStyles = no_hardcoded_styles_1.default;
const no_store_in_shared_component_1 = __importDefault(require("./reusability/no-store-in-shared-component"));
exports.noStoreInSharedComponent = no_store_in_shared_component_1.default;
const max_component_lines_1 = __importDefault(require("./reusability/max-component-lines"));
exports.maxComponentLines = max_component_lines_1.default;
const no_duplicate_blocks_1 = __importDefault(require("./reusability/no-duplicate-blocks"));
exports.noDuplicateBlocks = no_duplicate_blocks_1.default;
// Nx — exported separately; registered conditionally by check.ts
var enforce_module_boundaries_1 = require("./nx/enforce-module-boundaries");
Object.defineProperty(exports, "enforceModuleBoundaries", { enumerable: true, get: function () { return __importDefault(enforce_module_boundaries_1).default; } });
exports.ALL_RULES = [
    // Structure
    no_deep_nesting_1.default,
    feature_folder_1.default,
    barrel_file_1.default,
    // Naming
    component_pascal_case_1.default,
    hook_prefix_1.default,
    service_suffix_1.default,
    test_suffix_1.default,
    constants_upper_case_1.default,
    context_suffix_1.default,
    enum_pascal_case_1.default,
    // DDD
    no_cross_domain_1.default,
    layer_dependency_1.default,
    no_domain_bypass_1.default,
    no_business_logic_in_presentation_1.default,
    // Dependency
    no_circular_1.default,
    // Reusability
    props_interface_required_1.default,
    no_hardcoded_styles_1.default,
    no_store_in_shared_component_1.default,
    max_component_lines_1.default,
    no_duplicate_blocks_1.default,
];
//# sourceMappingURL=index.js.map