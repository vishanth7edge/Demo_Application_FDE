import { Rule, CheckResult, ScanResult, ArchGuardConfig } from '../types';
export declare class RuleEngine {
    private rules;
    register(rule: Rule): void;
    registerAll(rules: Rule[]): void;
    getRule(id: string): Rule | undefined;
    listRules(): Rule[];
    run(scanResult: ScanResult, config: ArchGuardConfig): CheckResult;
}
//# sourceMappingURL=index.d.ts.map