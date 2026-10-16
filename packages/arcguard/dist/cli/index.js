#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const check_1 = require("./commands/check");
const init_1 = require("./commands/init");
const list_rules_1 = require("./commands/list-rules");
const scaffold_1 = require("./commands/scaffold");
const analyze_1 = require("./commands/analyze");
const mcp_1 = require("./commands/mcp");
const fix_1 = require("./commands/fix");
const map_1 = require("./commands/map");
const dev_1 = require("./commands/dev");
const dep_1 = require("./commands/dep");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');
const program = new commander_1.Command();
program
    .name('arcguard')
    .description('Architecture governance platform for React and TypeScript applications')
    .version(version);
(0, check_1.registerCheckCommand)(program);
(0, init_1.registerInitCommand)(program);
(0, list_rules_1.registerListRulesCommand)(program);
(0, scaffold_1.registerScaffoldCommand)(program);
(0, analyze_1.registerAnalyzeCommand)(program);
(0, mcp_1.registerMcpCommand)(program);
(0, fix_1.registerFixCommand)(program);
(0, map_1.registerMapCommand)(program);
(0, dev_1.registerDevCommand)(program);
(0, dep_1.registerDepCommand)(program);
program.parse(process.argv);
//# sourceMappingURL=index.js.map