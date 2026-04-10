export type PantryRecipe = {
    id: string;
    name: string;
    type: string;
    time: string;
    ingredients: string[];
    highlight: string;
    tags: string[];
    priority: number;
};
export type PantryMatch = PantryRecipe & {
    hitCount: number;
    missing: string[];
    score: number;
};
export type PantryQueryResult = {
    isPantryQuery: boolean;
    ingredients: string[];
    full: PantryMatch[];
    partial: PantryMatch[];
};
export declare const PANTRY_RECIPES: PantryRecipe[];
export declare function extractIngredientsFromMessage(message: string): string[];
export declare function isPantryQuery(message: string, ingredients: string[]): boolean;
export declare function findPantryMatches(ingredients: string[]): {
    full: PantryMatch[];
    partial: PantryMatch[];
};
export declare function buildPantryQueryResult(message: string): PantryQueryResult;
export declare function buildPantryRecipeSuggestion(message: string): string | null;
export declare function getPantryRecipeLibraryStats(): {
    count: number;
    ingredientAliasCount: number;
};
//# sourceMappingURL=pantry-recipe.service.d.ts.map