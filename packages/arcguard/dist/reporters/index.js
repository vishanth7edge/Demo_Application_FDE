"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlReport = exports.sarifReport = exports.jsonReport = exports.consoleReport = void 0;
exports.runReporters = runReporters;
const path_1 = __importDefault(require("path"));
const console_1 = require("./console");
Object.defineProperty(exports, "consoleReport", { enumerable: true, get: function () { return console_1.consoleReport; } });
const json_1 = require("./json");
Object.defineProperty(exports, "jsonReport", { enumerable: true, get: function () { return json_1.jsonReport; } });
const sarif_1 = require("./sarif");
Object.defineProperty(exports, "sarifReport", { enumerable: true, get: function () { return sarif_1.sarifReport; } });
const html_1 = require("./html");
Object.defineProperty(exports, "htmlReport", { enumerable: true, get: function () { return html_1.htmlReport; } });
function runReporters(result, reporters, projectRoot, outputPath) {
    for (const name of reporters) {
        switch (name) {
            case 'console':
                (0, console_1.consoleReport)(result, projectRoot);
                break;
            case 'json': {
                const dest = outputPath ?? path_1.default.join(projectRoot, '.arcguard', 'report.json');
                (0, json_1.jsonReport)(result, dest);
                break;
            }
            case 'sarif': {
                const dest = outputPath ?? path_1.default.join(projectRoot, 'arcguard-results.sarif');
                (0, sarif_1.sarifReport)(result, projectRoot, dest);
                break;
            }
            case 'html': {
                const dest = outputPath ?? path_1.default.join(projectRoot, '.arcguard', 'report.html');
                (0, html_1.htmlReport)(result, projectRoot, dest);
                break;
            }
            default:
                console.warn(`[arcguard] Unknown reporter "${name}". Supported: console, json, sarif, html`);
        }
    }
}
//# sourceMappingURL=index.js.map