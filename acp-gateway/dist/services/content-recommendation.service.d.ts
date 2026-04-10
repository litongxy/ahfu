export interface Content {
    id: string;
    type: 'recipe' | 'exercise' | 'psychology' | 'sleep';
    title: string;
    description: string;
    imageUrl: string;
    calories?: number;
    duration?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags: string[];
    targetScenes: string[];
}
export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    description: string;
    tags: string[];
    targetScenes: string[];
}
export declare class ContentRecommendationService {
    private contents;
    private products;
    getContents(scene: string, limit?: number): Content[];
    getProducts(scene: string, limit?: number): Product[];
    searchContents(keyword: string, limit?: number): Content[];
    searchProducts(keyword: string, limit?: number): Product[];
    getContentById(id: string): Content | undefined;
    getProductById(id: string): Product | undefined;
    getAllContents(): Content[];
    getAllProducts(): Product[];
}
export declare const contentRecommendationService: ContentRecommendationService;
//# sourceMappingURL=content-recommendation.service.d.ts.map