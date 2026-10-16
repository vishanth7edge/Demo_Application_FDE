"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleCache = exports.socketCache = exports.auditCache = exports.registryCache = exports.TtlCache = void 0;
const disk_cache_js_1 = require("./disk-cache.js");
class TtlCache {
    constructor(ttlMs, namespace) {
        this.ttlMs = ttlMs;
        this.namespace = namespace;
        this.map = new Map();
    }
    get(key) {
        // 1. Check in-memory first
        const mem = this.map.get(key);
        if (mem) {
            if (Date.now() > mem.expiresAt) {
                this.map.delete(key);
            }
            else
                return mem.value;
        }
        // 2. Fall back to disk
        const disk = disk_cache_js_1.diskCache.get(`${this.namespace}:${key}`);
        if (disk !== undefined) {
            this.map.set(key, { value: disk, expiresAt: Date.now() + this.ttlMs });
            return disk;
        }
        return undefined;
    }
    set(key, value) {
        this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        disk_cache_js_1.diskCache.set(`${this.namespace}:${key}`, value, this.ttlMs);
    }
    clear() {
        this.map.clear();
    }
}
exports.TtlCache = TtlCache;
exports.registryCache = new TtlCache(60 * 60 * 1000, 'registry');
exports.auditCache = new TtlCache(10 * 60 * 1000, 'audit');
exports.socketCache = new TtlCache(60 * 60 * 1000, 'socket');
exports.bundleCache = new TtlCache(60 * 60 * 1000, 'bundle');
//# sourceMappingURL=cache.js.map