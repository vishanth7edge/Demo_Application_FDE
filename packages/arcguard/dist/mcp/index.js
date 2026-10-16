"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMcpServer = startMcpServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const get_context_1 = require("./tools/get-context");
const get_violations_1 = require("./tools/get-violations");
const get_violations_summary_1 = require("./tools/get-violations-summary");
const validate_file_1 = require("./tools/validate-file");
const scaffold_tool_1 = require("./tools/scaffold-tool");
const list_rules_1 = require("./tools/list-rules");
const apply_fix_1 = require("./tools/apply-fix");
const mcp_tools_js_1 = require("../runtime/mcp-tools.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');
const TOOL_DEFS = [
    {
        name: 'get_context',
        description: 'Returns the full AI-optimised architecture context for the project: health score, reusability score, domain structure, layer map, and all violations. Reads from cache if up-to-date, otherwise runs a fresh analysis.',
        inputSchema: {
            type: 'object',
            properties: {
                projectRoot: {
                    type: 'string',
                    description: 'Absolute path to the project root (defaults to the server\'s working directory)',
                },
            },
        },
    },
    {
        name: 'get_violations_summary',
        description: 'Returns a compact triage summary of violations grouped by rule, domain, and file — counts only, no per-violation detail. Use this first to understand the scope before calling get_violations.',
        inputSchema: {
            type: 'object',
            properties: {
                projectRoot: { type: 'string' },
            },
        },
    },
    {
        name: 'get_violations',
        description: 'Returns architecture violations with optional filters. Results are paginated (default limit: 100). Use offset to page through large result sets. Use baseRef to restrict to files changed since a git ref.',
        inputSchema: {
            type: 'object',
            properties: {
                projectRoot: { type: 'string' },
                severity: {
                    type: 'string',
                    enum: ['error', 'warning', 'info'],
                    description: 'Only return violations of this severity',
                },
                ruleId: {
                    type: 'string',
                    description: 'Only return violations from this rule (e.g. "ddd/no-cross-domain")',
                },
                file: {
                    type: 'string',
                    description: 'Only return violations from files whose path contains this substring',
                },
                baseRef: {
                    type: 'string',
                    description: 'Git ref (branch, commit SHA, or tag). When provided, only violations from files changed since that ref are returned. E.g. "main" to see violations only in your current branch\'s diff.',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum violations to return per page (default: 100, max: 500)',
                },
                offset: {
                    type: 'number',
                    description: 'Skip the first N violations (for pagination)',
                },
            },
        },
    },
    {
        name: 'list_rules',
        description: 'Returns the full catalog of built-in ArchGuard rules with id, description, default severity, category, and whether the rule is autofixable via apply_fix.',
        inputSchema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    enum: ['structure', 'naming', 'ddd', 'dependency', 'reusability'],
                    description: 'Filter to a specific category',
                },
            },
        },
    },
    {
        name: 'validate_file',
        description: 'Re-runs all architecture rules against a single file and returns its current violations. Use this after editing a file to confirm the violation has been fixed.',
        inputSchema: {
            type: 'object',
            required: ['path'],
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative or absolute path to the file to validate',
                },
                projectRoot: { type: 'string' },
            },
        },
    },
    {
        name: 'apply_fix',
        description: 'Applies a mechanical fix for a single violation — currently supports file renames (e.g. PascalCase, hook-prefix, service-suffix). Performs a git-aware rename and rewrites all import paths in files that reference the renamed file. Use dryRun: true to preview without writing.',
        inputSchema: {
            type: 'object',
            required: ['file', 'ruleId'],
            properties: {
                file: {
                    type: 'string',
                    description: 'Relative path to the file with the violation (as shown in get_violations)',
                },
                ruleId: {
                    type: 'string',
                    description: 'The rule ID of the violation to fix (e.g. "naming/component-pascal-case")',
                },
                dryRun: {
                    type: 'boolean',
                    description: 'If true, returns what would happen without writing any files',
                },
                projectRoot: { type: 'string' },
            },
        },
    },
    {
        name: 'scaffold',
        description: 'Generates a new component, hook, service, or module following the project\'s architecture conventions.',
        inputSchema: {
            type: 'object',
            required: ['type', 'name'],
            properties: {
                type: {
                    type: 'string',
                    enum: ['component', 'hook', 'service', 'module'],
                },
                name: { type: 'string', description: 'Name of the artefact (e.g. "UserCard", "useAuth")' },
                domain: { type: 'string', description: 'Domain/feature folder to place the file in' },
                dryRun: { type: 'boolean', description: 'If true, returns the file paths without writing them' },
                projectRoot: { type: 'string' },
            },
        },
    },
    ...mcp_tools_js_1.RUNTIME_TOOL_DEFS,
];
async function startMcpServer(projectRoot) {
    const server = new index_js_1.Server({ name: 'arcguard', version }, { capabilities: { tools: {} } });
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({ tools: TOOL_DEFS }));
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (req) => {
        const { name, arguments: args = {} } = req.params;
        const a = args;
        try {
            let result;
            switch (name) {
                case 'get_context':
                    result = await (0, get_context_1.handleGetContext)(a, projectRoot);
                    break;
                case 'get_violations_summary':
                    result = await (0, get_violations_summary_1.handleGetViolationsSummary)(a, projectRoot);
                    break;
                case 'get_violations':
                    result = await (0, get_violations_1.handleGetViolations)(a, projectRoot);
                    break;
                case 'list_rules':
                    result = (0, list_rules_1.handleListRules)(a);
                    break;
                case 'validate_file':
                    result = await (0, validate_file_1.handleValidateFile)(a, projectRoot);
                    break;
                case 'apply_fix':
                    result = await (0, apply_fix_1.handleApplyFix)(a, projectRoot);
                    break;
                case 'scaffold':
                    result = (0, scaffold_tool_1.handleScaffold)(a, projectRoot);
                    break;
                case 'get_console_errors':
                    result = await (0, mcp_tools_js_1.handleGetConsoleErrors)(a);
                    break;
                case 'get_network_requests':
                    result = await (0, mcp_tools_js_1.handleGetNetworkRequests)(a);
                    break;
                case 'get_runtime_snapshot':
                    result = await (0, mcp_tools_js_1.handleGetRuntimeSnapshot)(a);
                    break;
                case 'clear_runtime_store':
                    result = await (0, mcp_tools_js_1.handleClearRuntimeStore)(a);
                    break;
                case 'get_git_changes':
                    result = await (0, mcp_tools_js_1.handleGetGitChanges)(a);
                    break;
                case 'get_element_info':
                    result = await (0, mcp_tools_js_1.handleGetElementInfo)(a);
                    break;
                case 'get_action_timeline':
                    result = await (0, mcp_tools_js_1.handleGetActionTimeline)(a);
                    break;
                case 'get_har':
                    result = await (0, mcp_tools_js_1.handleGetHAR)(a);
                    break;
                case 'generate_regression_test':
                    result = await (0, mcp_tools_js_1.handleGenerateRegressionTest)(a);
                    break;
                case 'get_performance_report':
                    result = await (0, mcp_tools_js_1.handleGetPerformanceReport)(a);
                    break;
                case 'get_routes_performance':
                    result = await (0, mcp_tools_js_1.handleGetRoutesPerformance)(a);
                    break;
                case 'check_dependency':
                    result = await (0, mcp_tools_js_1.handleCheckDependency)(a);
                    break;
                case 'audit_dependencies':
                    result = await (0, mcp_tools_js_1.handleAuditDependencies)(a);
                    break;
                case 'find_duplicate_packages':
                    result = await (0, mcp_tools_js_1.handleFindDuplicatePackages)(a);
                    break;
                default:
                    return {
                        isError: true,
                        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                    };
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            return {
                isError: true,
                content: [{ type: 'text', text: String(err) }],
            };
        }
    });
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=index.js.map