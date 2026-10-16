import { Plugin, Rule } from '../types';
import { RuleEngine } from '../engine';
/**
 * Loads external plugin packages listed in config.plugins[] and registers
 * their rules into the engine.
 *
 * A plugin module must export a default object (or named export "plugin")
 * matching the Plugin interface: { name, rules: Rule[] }
 */
export declare function loadPlugins(plugins: string[], projectRoot: string, engine: RuleEngine): void;
/**
 * Helper to create a plugin package — export this from your custom plugin file.
 */
export declare function definePlugin(plugin: Plugin): Plugin;
/**
 * Helper to create a single rule — for authoring standalone rules.
 */
export declare function defineRule(rule: Rule): Rule;
//# sourceMappingURL=index.d.ts.map