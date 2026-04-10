export interface QuickQuestionItem {
    id: string;
    question: string;
    scene: string;
}
export declare class QuickQuestionsService {
    private readonly questionsDir;
    private cachedQuestions;
    constructor();
    getQuestions(limit?: number): QuickQuestionItem[];
    private loadQuestions;
    private buildQuestions;
    private collectTopicGroups;
    private extractTopics;
    private cleanTopic;
    private normalizeQuestion;
    private toFileLevelQuestion;
    private toPrimaryQuestion;
    private toSecondaryQuestion;
    private inferScene;
}
export declare const quickQuestionsService: QuickQuestionsService;
//# sourceMappingURL=quick-questions.service.d.ts.map