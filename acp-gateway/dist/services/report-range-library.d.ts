export type ReportRangeDefinition = {
    code: string;
    displayName: string;
    chineseName: string;
    category: 'blood' | 'urine' | 'liver' | 'renal' | 'lipid' | 'glucose' | 'thyroid' | 'tumor' | 'coagulation' | 'electrolyte' | 'inflammation';
    unit: string;
    normalRange: string;
    validRange: {
        min: number;
        max: number;
    };
    aliases: RegExp[];
    abnormalFindings: string[];
};
export type QualitativeIndicatorDefinition = {
    code: string;
    displayName: string;
    chineseName: string;
    category: 'urine';
    unit: string;
    normalRange: string;
    aliases: RegExp[];
    abnormalFindings: string[];
};
export declare const REPORT_RANGE_LIBRARY: ReportRangeDefinition[];
export declare const REPORT_RANGE_BASELINE_NOTES: string[];
export declare const BLOOD_RANGE_BASELINES: {
    name: string;
    chineseName: string;
    unit: string;
    normalRange: string;
}[];
export declare const URINE_RANGE_BASELINES: {
    name: string;
    chineseName: string;
    unit: string;
    normalRange: string;
}[];
export declare const URINE_QUALITATIVE_LIBRARY: QualitativeIndicatorDefinition[];
//# sourceMappingURL=report-range-library.d.ts.map