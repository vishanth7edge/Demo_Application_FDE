"use strict";
/** In-memory ring-buffer store shared by the runtime server and Vite plugin. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionStore = exports.networkStore = exports.consoleStore = void 0;
exports.setPageUrl = setPageUrl;
exports.setLastElement = setLastElement;
exports.getLastElement = getLastElement;
exports.getSnapshot = getSnapshot;
const MAX = 200;
class RingBuffer {
    constructor() {
        this.items = [];
        this._counter = 0;
    }
    nextId() { return ++this._counter; }
    push(item) {
        if (this.items.length >= MAX)
            this.items.shift();
        this.items.push(item);
    }
    all() { return [...this.items]; }
    clear() { this.items = []; this._counter = 0; }
}
exports.consoleStore = new RingBuffer();
exports.networkStore = new RingBuffer();
exports.actionStore = new RingBuffer();
let _pageUrl = 'unknown';
let _lastElement = null;
function setPageUrl(url) { _pageUrl = url; }
function setLastElement(el) { _lastElement = el; }
function getLastElement() { return _lastElement; }
function getSnapshot() {
    const consolEvents = exports.consoleStore.all();
    const netEvents = exports.networkStore.all();
    return {
        capturedAt: new Date().toISOString(),
        pageUrl: _pageUrl,
        consoleEvents: consolEvents,
        networkEvents: netEvents,
        errorCount: consolEvents.filter(e => e.type === 'error').length,
        failedRequestCount: netEvents.filter(e => e.status === 0 || e.status >= 400).length,
    };
}
//# sourceMappingURL=storage.js.map