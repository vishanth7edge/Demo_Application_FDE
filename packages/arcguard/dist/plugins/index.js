"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPlugins = loadPlugins;
exports.definePlugin = definePlugin;
exports.defineRule = defineRule;
const path_1 = __importDefault(require("path"));
/**
 * Loads external plugin packages listed in config.plugins[] and registers
 * their rules into the engine.
 *
 * A plugin module must export a default object (or named export "plugin")
 * matching the Plugin interface: { name, rules: Rule[] }
 */
function loadPlugins(plugins, projectRoot, engine) {
    for (const pluginPath of plugins) {
        try {
            const resolved = pluginPath.startsWith('.')
                ? path_1.default.resolve(projectRoot, pluginPath)
                : pluginPath;
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const mod = require(resolved);
            const plugin = mod.default ??
                mod.plugin ??
                (isPlugin(mod) ? mod : undefined);
            if (!plugin) {
                console.warn(`[arcguard] Plugin "${pluginPath}" does not export a valid Plugin object.`);
                continue;
            }
            engine.registerAll(plugin.rules ?? []);
            console.log(`[arcguard] Loaded plugin "${plugin.name}" (${plugin.rules?.length ?? 0} rules).`);
        }
        catch (err) {
            console.warn(`[arcguard] Failed to load plugin "${pluginPath}": ${String(err)}`);
        }
    }
}
function isPlugin(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'name' in obj &&
        'rules' in obj &&
        Array.isArray(obj.rules));
}
/**
 * Helper to create a plugin package — export this from your custom plugin file.
 */
function definePlugin(plugin) {
    return plugin;
}
/**
 * Helper to create a single rule — for authoring standalone rules.
 */
function defineRule(rule) {
    return rule;
}
//# sourceMappingURL=index.js.map