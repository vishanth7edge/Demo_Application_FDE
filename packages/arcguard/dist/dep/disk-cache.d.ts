declare class DiskCache {
    private mem;
    constructor();
    get(key: string): unknown | undefined;
    set(key: string, value: unknown, ttlMs: number): void;
}
export declare const diskCache: DiskCache;
export {};
//# sourceMappingURL=disk-cache.d.ts.map