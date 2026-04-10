interface KnowledgeEntry {
    file: string;
    title: string;
    content: string;
    keywords: string[];
}
export declare class QuestionsKnowledgeService {
    private entries;
    private loaded;
    private questionsDir;
    constructor();
    private load;
    private splitSections;
    private extractKeywords;
    private extractQueryTerms;
    search(query: string, maxResults?: number): KnowledgeEntry[];
    getRelevantContext(query: string): string;
    getDirectAnswer(query: string): string;
    private extractRelevantSections;
    getAllFiles(): string[];
    getEntryByTitle(title: string): KnowledgeEntry | undefined;
}
export declare const questionsKnowledge: QuestionsKnowledgeService;
export {};
//# sourceMappingURL=questions-knowledge.service.d.ts.map