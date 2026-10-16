export interface ArcGuardPluginOptions {
    /** Port for the ArchGuard runtime server (default: 7432) */
    port?: number;
    /** Disable the plugin entirely (e.g. for production builds) */
    disabled?: boolean;
}
/** Vite-compatible plugin object. Typed loosely so vite doesn't need to be an installed dependency. */
export declare function arcguardVitePlugin(options?: ArcGuardPluginOptions): any;
//# sourceMappingURL=vite-plugin.d.ts.map