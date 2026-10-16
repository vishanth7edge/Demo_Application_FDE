"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
/**
 * Presentation layer files (components, pages, hooks) must not contain business logic.
 *
 * Flags three patterns:
 *  1. Direct API calls  — fetch(), axios., XMLHttpRequest  (should live in infrastructure)
 *  2. Direct domain imports — importing from a sibling domain/ folder
 *  3. Non-UI utility functions — exported functions whose names do not follow UI conventions
 *     (use*, handle*, on*, render*) and whose body contains ≥ 3 statements.
 */
const rule = {
    id: 'ddd/no-business-logic-in-presentation',
    name: 'No Business Logic in Presentation',
    description: 'Presentation layer files must not contain API calls, domain imports, or business logic functions.',
    severity: 'error',
    category: 'ddd',
    check(context, options) {
        const violations = [];
        for (const file of context.files) {
            if (!isInLayer(file.relativePath, 'presentation'))
                continue;
            checkDirectApiCalls(file, this, violations);
            checkDomainImports(file, this, violations, context.projectRoot);
            checkBusinessFunctions(file, this, violations);
        }
        return violations;
    },
};
// ── Checks ────────────────────────────────────────────────────────────────────
function checkDirectApiCalls(file, rule, violations) {
    const patterns = [
        { re: /\bfetch\s*\(/, label: 'fetch()' },
        { re: /\baxios\s*[.(]/, label: 'axios' },
        { re: /new\s+XMLHttpRequest\s*\(/, label: 'XMLHttpRequest' },
    ];
    for (const { re, label } of patterns) {
        if (re.test(file.content)) {
            const lineNo = findLineNumber(file.content, re);
            violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                category: rule.category,
                message: `Presentation file uses ${label} directly. API calls belong in the infrastructure layer.`,
                filePath: file.path,
                relativePath: file.relativePath,
                line: lineNo,
                suggestion: `Extract the API call into an infrastructure service and consume it via an application-layer use-case.`,
            });
        }
    }
}
function checkDomainImports(file, rule, violations, projectRoot) {
    for (const imp of file.imports) {
        if (!path_1.default.isAbsolute(imp))
            continue;
        const impRelative = path_1.default.relative(projectRoot, imp);
        if (isInLayer(impRelative, 'domain')) {
            violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                category: rule.category,
                message: `Presentation file imports directly from the domain layer ("${impRelative}"). Use the application layer as intermediary.`,
                filePath: file.path,
                relativePath: file.relativePath,
                suggestion: `Expose the needed data/behaviour through an application-layer service or use-case.`,
            });
        }
    }
}
function checkBusinessFunctions(file, rule, violations) {
    // Match exported named functions not following UI conventions
    const fnRe = /export\s+(?:function|const)\s+([a-z][A-Za-z0-9]*)\s*(?:=\s*(?:async\s*)?\(|[(<])/g;
    const uiPrefixes = ['use', 'handle', 'on', 'render', 'get', 'set', 'format', 'to'];
    let m;
    while ((m = fnRe.exec(file.content)) !== null) {
        const name = m[1];
        if (uiPrefixes.some(p => name.startsWith(p)))
            continue;
        // Check if the function body has ≥ 3 statements (rough heuristic via semicolon count)
        const bodyStart = file.content.indexOf('{', m.index + m[0].length);
        if (bodyStart === -1)
            continue;
        const body = extractBraceBlock(file.content, bodyStart);
        const stmtCount = (body.match(/;/g) ?? []).length;
        if (stmtCount >= 3) {
            violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                category: rule.category,
                message: `Function "${name}" in a presentation file looks like business logic (${stmtCount} statements). Move it to the application layer.`,
                filePath: file.path,
                relativePath: file.relativePath,
                line: findLineNumber(file.content, new RegExp(`\\b${name}\\b`)),
                suggestion: `Move "${name}" to the application layer (use-case or service).`,
            });
        }
    }
}
// ── Utilities ─────────────────────────────────────────────────────────────────
function isInLayer(relativePath, layer) {
    return relativePath.split(/[/\\]/).includes(layer);
}
function findLineNumber(content, re) {
    const match = re.exec(content);
    if (!match)
        return undefined;
    return content.slice(0, match.index).split('\n').length;
}
function extractBraceBlock(content, start) {
    let depth = 0;
    let i = start;
    while (i < content.length) {
        if (content[i] === '{')
            depth++;
        else if (content[i] === '}') {
            depth--;
            if (depth === 0)
                return content.slice(start, i + 1);
        }
        i++;
    }
    return content.slice(start);
}
exports.default = rule;
//# sourceMappingURL=no-business-logic-in-presentation.js.map