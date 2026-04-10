export interface AgentMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface AgentContext {
    userId?: string;
    scene?: string;
    history?: AgentMessage[];
}
export interface AgentResult {
    response: string;
    scene: string;
    recommendations?: {
        contents: unknown[];
        goods: unknown[];
        pages: Array<{
            name: string;
            url: string;
            icon?: string;
        }>;
    };
}
export interface HealthProfile {
    userId: string;
    name?: string;
    age?: number;
    gender?: string;
    chronicDisease?: string[];
    allergy?: string[];
    symptoms?: string[];
    surgeryHistory?: string[];
    familyHistory?: string[];
    medicationHistory?: string[];
    dietHabit?: string;
    exerciseHabit?: string;
    sleepInfo?: string;
    lastCheckup?: string;
}
export declare function buildPantryRecipeSuggestion(message: string): string | null;
export declare class OpencodeAgentService {
    private knowledgeService;
    private recommendationService;
    private useAI;
    initialize(): Promise<void>;
    chat(message: string, context: AgentContext): Promise<AgentResult>;
    private shouldRecommendProfileAndReport;
    private getProfileAndReportPages;
    private callAI;
    private detectScene;
    private isOutOfScope;
    private hasMedicalKnowledgeHit;
    private shouldPreferWebSearch;
    private tryAnswerWithWebSearch;
    private isSmallTalk;
    private looksLikeHealthQuestion;
    private getOutOfScopeResponse;
    private getMissingKnowledgeResponse;
    private getFallbackResponse;
    private shouldTriggerWebSearch;
    private isCookingRecipeIntent;
    private getCookingIntentFallback;
    private formatWebResultsForPrompt;
    private formatWebSearchAnswer;
}
export declare const opencodeAgent: OpencodeAgentService;
//# sourceMappingURL=opencode-agent.service.d.ts.map