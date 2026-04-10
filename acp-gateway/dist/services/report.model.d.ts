export interface ReportIndicator {
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
    isAnomaly: boolean;
    severity: 'normal' | 'slight' | 'abnormal' | 'serious';
    suggestion?: string;
}
export declare const BLOOD_INDICATORS: {
    name: string;
    chineseName: string;
    unit: string;
    normalRange: string;
}[];
export interface HealthReport {
    id: string;
    userId: string;
    reportUrl?: string;
    originalName?: string;
    extractedText?: string;
    uploadTime: Date;
    indicators: ReportIndicator[];
    anomalyCount: number;
    analysisResult?: string;
    aiAnalysis?: string;
    status: 'parsing' | 'parsed' | 'failed';
}
export interface InterventionPlan {
    summary: string;
    diet: Array<{
        title: string;
        description: string;
        recipes: string[];
    }>;
    exercise: Array<{
        title: string;
        description: string;
        courses: string[];
    }>;
    sleep: Array<{
        title: string;
        description: string;
        courses: string[];
    }>;
    followUp: string;
}
export interface ReportAnalysisResult {
    indicators: ReportIndicator[];
    anomalyItems: ReportIndicator[];
    analysisSummary: string;
    interventionPlan?: InterventionPlan;
}
export declare const URINE_INDICATORS: {
    name: string;
    chineseName: string;
    unit: string;
    normalRange: string;
}[];
export declare function parseValue(valueStr: string, normalRange: string): {
    value: number;
    isAnomaly: boolean;
    severity: 'normal' | 'slight' | 'abnormal' | 'serious';
};
export declare function generateAnomalySuggestions(indicator: ReportIndicator): string;
//# sourceMappingURL=report.model.d.ts.map