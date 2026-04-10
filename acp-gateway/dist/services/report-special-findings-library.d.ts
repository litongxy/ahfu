export type SpecialFindingSeverity = 'slight' | 'abnormal' | 'serious';
export type SpecialFindingRule = {
    code: string;
    displayName: string;
    aliases: RegExp[];
    suggestion: string;
    defaultSeverity: SpecialFindingSeverity;
    negativeAliases?: RegExp[];
};
export declare const DEFAULT_NEGATIVE_FINDING_PATTERNS: RegExp[];
export declare const SPECIAL_FINDING_LIBRARY: SpecialFindingRule[];
export declare const SPECIAL_FINDING_HEALTH_KEYWORDS: string[];
//# sourceMappingURL=report-special-findings-library.d.ts.map