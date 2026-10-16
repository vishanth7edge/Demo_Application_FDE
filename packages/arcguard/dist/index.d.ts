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
export { scan } from './scanner';
export { RuleEngine } from './engine';
export { computeHealthScore, computeReusabilityScore } from './engine/health-score';
export { loadConfig, mergeConfig, getDefaultConfig } from './config/loader';
export { ALL_RULES, enforceModuleBoundaries } from './rules';
export { loadPlugins, definePlugin, defineRule } from './plugins';
export { consoleReport, jsonReport, sarifReport, htmlReport } from './reporters';
export { scaffold } from './scaffold';
export { startMcpServer } from './mcp';
export { buildContext, readContext, isStale, getOrBuildContext } from './mcp/cache';
export { arcguardVitePlugin } from './vite-plugin';
export { createRuntimeServer, DEFAULT_RUNTIME_PORT, generateWidgetScript } from './runtime/index';
export { readNxWorkspace, isNxWorkspace, resolveNxProject } from './nx';
export type { Rule, Plugin, Violation, FileNode, DependencyGraph, ScanResult, CheckResult, ViolationSummary, RuleContext, RuleConfig, ArchGuardConfig, Severity, RuleCategory, HealthScore, CategoryScore, ReusabilityScore, ReusabilityMetric, StructureConfig, NamingConfig, DDDConfig, DependencyConfig, ReusabilityConfig, NxConfig, NxProject, NxDepConstraint, } from './types';
export type { ScaffoldOptions, ScaffoldType, ScaffoldResult } from './scaffold';
export type { ConsoleEvent, NetworkEvent, RuntimeSnapshot, ElementInfo, ActionEvent, WidgetOptions, RuntimeToolArgs } from './runtime/index';
export type { ArcGuardPluginOptions } from './vite-plugin';
//# sourceMappingURL=index.d.ts.map