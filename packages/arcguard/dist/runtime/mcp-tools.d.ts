export interface RuntimeToolArgs {
    port?: number;
    limit?: number;
    sinceId?: number;
    type?: 'error' | 'warn' | 'log' | 'info';
    method?: string;
    statusMin?: number;
}
export declare function handleGetConsoleErrors(args: RuntimeToolArgs): Promise<unknown>;
export declare function handleGetNetworkRequests(args: RuntimeToolArgs): Promise<unknown>;
export declare function handleGetRuntimeSnapshot(args: RuntimeToolArgs): Promise<unknown>;
export declare function handleClearRuntimeStore(args: RuntimeToolArgs): Promise<unknown>;
export declare function handleGetGitChanges(args: RuntimeToolArgs): Promise<unknown>;
export declare function handleGetElementInfo(args: RuntimeToolArgs): Promise<unknown>;
export declare function handleGetHAR(args: RuntimeToolArgs): Promise<unknown>;
export declare function handleGenerateRegressionTest(args: RuntimeToolArgs & {
    framework?: string;
}): Promise<unknown>;
export declare function handleGetPerformanceReport(args: RuntimeToolArgs): Promise<unknown>;
export declare function handleGetRoutesPerformance(args: RuntimeToolArgs): Promise<unknown>;
export declare function handleCheckDependency(args: RuntimeToolArgs & {
    packageName?: string;
    projectRoot?: string;
}): Promise<unknown>;
export declare function handleAuditDependencies(args: RuntimeToolArgs & {
    projectRoot?: string;
    limit?: number;
    severity?: string;
}): Promise<unknown>;
export declare function handleFindDuplicatePackages(args: RuntimeToolArgs & {
    projectRoot?: string;
}): Promise<unknown>;
export declare function handleGetActionTimeline(args: RuntimeToolArgs & {
    limit?: number;
}): Promise<unknown>;
export declare const RUNTIME_TOOL_DEFS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            port: {
                readonly type: "number";
                readonly description: "Port the arcguard runtime server is listening on (default: 7432)";
            };
            packageName?: undefined;
            projectRoot?: undefined;
            limit?: undefined;
            severity?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            framework: {
                type: string;
                enum: string[];
                description: string;
            };
            port: {
                readonly type: "number";
                readonly description: "Port the arcguard runtime server is listening on (default: 7432)";
            };
            packageName?: undefined;
            projectRoot?: undefined;
            limit?: undefined;
            severity?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            limit: {
                type: string;
                description: string;
            };
            port: {
                readonly type: "number";
                readonly description: "Port the arcguard runtime server is listening on (default: 7432)";
            };
            packageName?: undefined;
            projectRoot?: undefined;
            severity?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        required: string[];
        properties: {
            packageName: {
                type: string;
                description: string;
            };
            projectRoot: {
                type: string;
                description: string;
            };
            limit?: undefined;
            severity?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            projectRoot: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            severity: {
                type: string;
                enum: string[];
                description: string;
            };
            packageName?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            projectRoot: {
                type: string;
                description: string;
            };
            packageName?: undefined;
            limit?: undefined;
            severity?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            sinceId: {
                type: string;
                description: string;
            };
            port: {
                readonly type: "number";
                readonly description: "Port the arcguard runtime server is listening on (default: 7432)";
            };
            packageName?: undefined;
            projectRoot?: undefined;
            severity?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            method: {
                type: string;
                description: string;
            };
            statusMin: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            sinceId: {
                type: string;
                description: string;
            };
            port: {
                readonly type: "number";
                readonly description: "Port the arcguard runtime server is listening on (default: 7432)";
            };
            packageName?: undefined;
            projectRoot?: undefined;
            severity?: undefined;
        };
        required?: undefined;
    };
})[];
//# sourceMappingURL=mcp-tools.d.ts.map