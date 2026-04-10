const path = require('path');

const servicePath = path.resolve(__dirname, '../dist/services/pantry-recipe.service.js');

describe('pantry recipe library', () => {
  test('builds at least 1000 common pantry recipes', () => {
    const { getPantryRecipeLibraryStats } = require(servicePath);
    const stats = getPantryRecipeLibraryStats();

    expect(stats.count).toBeGreaterThanOrEqual(1000);
    expect(stats.ingredientAliasCount).toBeGreaterThan(20);
  });
});
