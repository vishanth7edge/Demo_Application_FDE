export declare class TtlCache<T> {
    private readonly ttlMs;
    private readonly namespace;
    private map;
    constructor(ttlMs: number, namespace: string);
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    clear(): void;
}
export declare const registryCache: TtlCache<unknown>;
export declare const auditCache: TtlCache<unknown>;
export declare const socketCache: TtlCache<unknown>;
export declare const bundleCache: TtlCache<unknown>;
//# sourceMappingURL=cache.d.ts.map