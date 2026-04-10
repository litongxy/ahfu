import type { HealthReport } from './report.model';
import { type HealthProfile } from './user-profile.store';
type ContentType = 'recipe' | 'exercise' | 'psychology' | 'sleep';
type ExerciseIntensity = 'low' | 'medium' | 'high';
export interface Content {
    id: string;
    type: ContentType;
    title: string;
    description: string;
    calories?: number;
    duration?: number;
    durationSeconds?: number;
    tags: string[];
    reason?: string;
    url?: string;
    imageUrl?: string;
    bvid?: string;
    posterUrl?: string;
    intensity?: ExerciseIntensity;
}
export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    imageUrl: string;
    tags?: string[];
}
export interface Page {
    name: string;
    url: string;
}
export interface RecommendationOptions {
    userId?: string;
    message?: string;
    profile?: HealthProfile | null;
    report?: HealthReport | null;
}
type ContentCatalogItem = Omit<Content, 'reason'>;
type RecipeCatalogItem = ContentCatalogItem & {
    type: 'recipe';
};
type ExerciseCatalogItem = ContentCatalogItem & {
    type: 'exercise';
};
export declare class RecommendationService {
    private readonly recommendationHistoryByKey;
    private readonly recommendationCursorByKey;
    getRecommendations(scene: string, options?: RecommendationOptions): Promise<{
        contents: Content[];
        goods: Product[];
        pages: Page[];
    }>;
    getRecommendationsSync(scene: string, userId?: string, message?: string): {
        contents: Content[];
        goods: Product[];
        pages: Page[];
    };
    private buildSignals;
    private getPreferredContentTypes;
    private scoreContent;
    private buildReason;
    private resolveContentUrl;
    private withResolvedUrl;
    private buildPantryContents;
    private buildDiversityKey;
    private getRecentRecommendationIds;
    private rememberRecommendationIds;
    private takeFromPoolWithCursor;
    private pickRankedCandidates;
    private shouldPrioritizeSignatureRecipes;
    private getSignatureRecipePriority;
    private pickSignatureRecipes;
    private toReasonedContents;
    private selectContents;
    private getGoodsByScene;
    private getPagesByScene;
    getContents(): Promise<Content[]>;
    getStoredRecipes(): Promise<RecipeCatalogItem[]>;
    getStoredExerciseVideos(): Promise<ExerciseCatalogItem[]>;
    saveStoredRecipes(items: unknown): Promise<RecipeCatalogItem[]>;
    saveStoredExerciseVideos(items: unknown): Promise<ExerciseCatalogItem[]>;
    getProducts(): Promise<Product[]>;
    getPages(): Promise<Page[]>;
}
export {};
//# sourceMappingURL=recommendation.service.d.ts.map