interface KnowledgeItem {
    question: string;
    answer: string;
    scene: string;
    tags: string[];
}
export declare class KnowledgeService {
    search(keyword: string, scene?: string): Promise<KnowledgeItem[]>;
    searchSync(keyword: string, scene?: string): KnowledgeItem[];
    getByScene(scene: string): Promise<KnowledgeItem[]>;
    getAll(): Promise<KnowledgeItem[]>;
    add(item: KnowledgeItem): Promise<void>;
}
export {};
//# sourceMappingURL=knowledge.service.d.ts.map