import { CheckResult } from '../types';
/**
 * Produces a SARIF 2.1.0 file for GitHub Actions inline PR annotations.
 *
 * Usage in .github/workflows/ci.yml:
 *   - run: arcguard check --reporter sarif --output arcguard-results.sarif
 *   - uses: github/codeql-action/upload-sarif@v3
 *     with:
 *       sarif_file: arcguard-results.sarif
 */
export declare function sarifReport(result: CheckResult, projectRoot: string, outputPath: string): void;
//# sourceMappingURL=sarif.d.ts.map