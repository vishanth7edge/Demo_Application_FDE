"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diskCache = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CACHE_DIR = path_1.default.join(os_1.default.homedir(), '.arcguard');
const CACHE_FILE = path_1.default.join(CACHE_DIR, 'cache.json');
function loadStore() {
    try {
        return JSON.parse(fs_1.default.readFileSync(CACHE_FILE, 'utf8'));
    }
    catch {
        return {};
    }
}
function saveStore(store) {
    try {
        fs_1.default.mkdirSync(CACHE_DIR, { recursive: true });
        fs_1.default.writeFileSync(CACHE_FILE, JSON.stringify(store), 'utf8');
    }
    catch { /* non-fatal */ }
}
// Prune expired entries and keep file lean
function pruneStore(store) {
    const now = Date.now();
    const pruned = {};
    for (const [k, v] of Object.entries(store)) {
        if (v.expiresAt > now)
            pruned[k] = v;
    }
    return pruned;
}
class DiskCache {
    constructor() {
        this.mem = pruneStore(loadStore());
    }
    get(key) {
        const entry = this.mem[key];
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            delete this.mem[key];
            return undefined;
        }
        return entry.value;
    }
    set(key, value, ttlMs) {
        this.mem[key] = { value, expiresAt: Date.now() + ttlMs };
        saveStore(this.mem);
    }
}
exports.diskCache = new DiskCache();
//# sourceMappingURL=disk-cache.js.map