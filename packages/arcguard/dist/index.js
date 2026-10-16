"use strict";
/**
 * Public API — import this when using arcguard programmatically.
 *
 * Example:
 *   import { scan, RuleEngine, ALL_RULES, loadConfig } from '@7edge/arcguard';
 *
 *   const config = loadConfig(process.cwd());
 *   const engine = new RuleEngine();
 *   engine.registerAll(ALL_RULES);
 *   const scanResult = await scan(process.cwd(), config);
 *   const result = engine.run(scanResult, config);
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveNxProject = exports.isNxWorkspace = exports.readNxWorkspace = exports.generateWidgetScript = exports.DEFAULT_RUNTIME_PORT = exports.createRuntimeServer = exports.arcguardVitePlugin = exports.getOrBuildContext = exports.isStale = exports.readContext = exports.buildContext = exports.startMcpServer = exports.scaffold = exports.htmlReport = exports.sarifReport = exports.jsonReport = exports.consoleReport = exports.defineRule = exports.definePlugin = exports.loadPlugins = exports.enforceModuleBoundaries = exports.ALL_RULES = exports.getDefaultConfig = exports.mergeConfig = exports.loadConfig = exports.computeReusabilityScore = exports.computeHealthScore = exports.RuleEngine = exports.scan = void 0;
var scanner_1 = require("./scanner");
Object.defineProperty(exports, "scan", { enumerable: true, get: function () { return scanner_1.scan; } });
var engine_1 = require("./engine");
Object.defineProperty(exports, "RuleEngine", { enumerable: true, get: function () { return engine_1.RuleEngine; } });
var health_score_1 = require("./engine/health-score");
Object.defineProperty(exports, "computeHealthScore", { enumerable: true, get: function () { return health_score_1.computeHealthScore; } });
Object.defineProperty(exports, "computeReusabilityScore", { enumerable: true, get: function () { return health_score_1.computeReusabilityScore; } });
var loader_1 = require("./config/loader");
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return loader_1.loadConfig; } });
Object.defineProperty(exports, "mergeConfig", { enumerable: true, get: function () { return loader_1.mergeConfig; } });
Object.defineProperty(exports, "getDefaultConfig", { enumerable: true, get: function () { return loader_1.getDefaultConfig; } });
var rules_1 = require("./rules");
Object.defineProperty(exports, "ALL_RULES", { enumerable: true, get: function () { return rules_1.ALL_RULES; } });
Object.defineProperty(exports, "enforceModuleBoundaries", { enumerable: true, get: function () { return rules_1.enforceModuleBoundaries; } });
var plugins_1 = require("./plugins");
Object.defineProperty(exports, "loadPlugins", { enumerable: true, get: function () { return plugins_1.loadPlugins; } });
Object.defineProperty(exports, "definePlugin", { enumerable: true, get: function () { return plugins_1.definePlugin; } });
Object.defineProperty(exports, "defineRule", { enumerable: true, get: function () { return plugins_1.defineRule; } });
var reporters_1 = require("./reporters");
Object.defineProperty(exports, "consoleReport", { enumerable: true, get: function () { return reporters_1.consoleReport; } });
Object.defineProperty(exports, "jsonReport", { enumerable: true, get: function () { return reporters_1.jsonReport; } });
Object.defineProperty(exports, "sarifReport", { enumerable: true, get: function () { return reporters_1.sarifReport; } });
Object.defineProperty(exports, "htmlReport", { enumerable: true, get: function () { return reporters_1.htmlReport; } });
var scaffold_1 = require("./scaffold");
Object.defineProperty(exports, "scaffold", { enumerable: true, get: function () { return scaffold_1.scaffold; } });
var mcp_1 = require("./mcp");
Object.defineProperty(exports, "startMcpServer", { enumerable: true, get: function () { return mcp_1.startMcpServer; } });
var cache_1 = require("./mcp/cache");
Object.defineProperty(exports, "buildContext", { enumerable: true, get: function () { return cache_1.buildContext; } });
Object.defineProperty(exports, "readContext", { enumerable: true, get: function () { return cache_1.readContext; } });
Object.defineProperty(exports, "isStale", { enumerable: true, get: function () { return cache_1.isStale; } });
Object.defineProperty(exports, "getOrBuildContext", { enumerable: true, get: function () { return cache_1.getOrBuildContext; } });
var vite_plugin_1 = require("./vite-plugin");
Object.defineProperty(exports, "arcguardVitePlugin", { enumerable: true, get: function () { return vite_plugin_1.arcguardVitePlugin; } });
var index_1 = require("./runtime/index");
Object.defineProperty(exports, "createRuntimeServer", { enumerable: true, get: function () { return index_1.createRuntimeServer; } });
Object.defineProperty(exports, "DEFAULT_RUNTIME_PORT", { enumerable: true, get: function () { return index_1.DEFAULT_RUNTIME_PORT; } });
Object.defineProperty(exports, "generateWidgetScript", { enumerable: true, get: function () { return index_1.generateWidgetScript; } });
var nx_1 = require("./nx");
Object.defineProperty(exports, "readNxWorkspace", { enumerable: true, get: function () { return nx_1.readNxWorkspace; } });
Object.defineProperty(exports, "isNxWorkspace", { enumerable: true, get: function () { return nx_1.isNxWorkspace; } });
Object.defineProperty(exports, "resolveNxProject", { enumerable: true, get: function () { return nx_1.resolveNxProject; } });
//# sourceMappingURL=index.js.map