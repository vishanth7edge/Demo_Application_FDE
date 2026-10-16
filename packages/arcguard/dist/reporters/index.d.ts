import { CheckResult } from '../types';
import { consoleReport } from './console';
import { jsonReport } from './json';
import { sarifReport } from './sarif';
import { htmlReport } from './html';
export type ReporterName = 'console' | 'json' | 'sarif' | 'html';
export declare function runReporters(result: CheckResult, reporters: string[], projectRoot: string, outputPath?: string): void;
export { consoleReport, jsonReport, sarifReport, htmlReport };
//# sourceMappingURL=index.d.ts.map