export type IngredientCategory = 'vegetable' | 'mushroom' | 'fish' | 'shellfish' | 'meat' | 'bean_grain' | 'fruit' | 'spice';
export interface IngredientAliasDefinition {
    canonical: string;
    category: IngredientCategory;
    aliases?: string[];
}
export declare function buildExtendedIngredientAliasMap(): Record<string, string[]>;
export declare function getExtendedIngredientCatalogStats(): {
    canonicalCount: number;
    termCount: number;
};
//# sourceMappingURL=extended-ingredient-catalog.d.ts.map