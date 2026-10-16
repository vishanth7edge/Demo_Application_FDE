/** In-memory ring-buffer store shared by the runtime server and Vite plugin. */
export interface ConsoleEvent {
    id: number;
    type: 'error' | 'warn' | 'log' | 'info';
    message: string;
    stack?: string;
    sourceUrl?: string;
    line?: number;
    col?: number;
    timestamp: number;
}
export interface NetworkEvent {
    id: number;
    method: string;
    url: string;
    status: number;
    duration: number;
    requestBody?: string;
    requestHeaders?: Record<string, string>;
    requestMimeType?: string;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    responseMimeType?: string;
    responseSize?: number;
    error?: string;
    timestamp: number;
}
export interface RuntimeSnapshot {
    capturedAt: string;
    pageUrl: string;
    consoleEvents: ConsoleEvent[];
    networkEvents: NetworkEvent[];
    errorCount: number;
    failedRequestCount: number;
}
declare class RingBuffer<T> {
    private items;
    private _counter;
    nextId(): number;
    push(item: T): void;
    all(): T[];
    clear(): void;
}
export interface ElementInfo {
    tag: string;
    id?: string;
    className?: string;
    text?: string;
    componentName?: string;
    componentChain?: string[];
    sourceFile?: string;
    sourceLine?: number;
    props?: Record<string, string>;
    ancestorPath: string[];
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    capturedAt: number;
}
export interface ActionEvent {
    id: number;
    type: 'click' | 'input' | 'navigation' | 'submit' | 'keydown' | 'scroll';
    target?: string;
    value?: string;
    url?: string;
    timestamp: number;
}
export declare const consoleStore: RingBuffer<ConsoleEvent>;
export declare const networkStore: RingBuffer<NetworkEvent>;
export declare const actionStore: RingBuffer<ActionEvent>;
export declare function setPageUrl(url: string): void;
export declare function setLastElement(el: ElementInfo): void;
export declare function getLastElement(): ElementInfo | null;
export declare function getSnapshot(): RuntimeSnapshot;
export {};
//# sourceMappingURL=storage.d.ts.map