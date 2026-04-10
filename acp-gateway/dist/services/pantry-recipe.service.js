"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PANTRY_RECIPES = void 0;
exports.extractIngredientsFromMessage = extractIngredientsFromMessage;
exports.isPantryQuery = isPantryQuery;
exports.findPantryMatches = findPantryMatches;
exports.buildPantryQueryResult = buildPantryQueryResult;
exports.buildPantryRecipeSuggestion = buildPantryRecipeSuggestion;
exports.getPantryRecipeLibraryStats = getPantryRecipeLibraryStats;
const extended_ingredient_catalog_1 = require("../data/extended-ingredient-catalog");
const TARGET_PANTRY_RECIPE_COUNT = 1000;
const PANTRY_CORE_INGREDIENT_ALIASES = {
    番茄: ['番茄', '西红柿', '西红柿块', '番茄块'],
    鸡蛋: ['鸡蛋', '蛋', '鸭蛋'],
    豆腐: ['豆腐', '嫩豆腐', '老豆腐', '北豆腐', '南豆腐'],
    挂面: ['挂面', '面条', '细面', '面饼'],
    米饭: ['米饭', '剩饭', '白米饭'],
    青椒: ['青椒', '尖椒', '彩椒', '甜椒', '辣椒', '青辣椒', '红辣椒', '小米椒', '线椒'],
    洋葱: ['洋葱', '紫洋葱'],
    黄瓜: ['黄瓜', '青瓜'],
    木耳: ['木耳', '黑木耳'],
    菠菜: ['菠菜'],
    香菇: ['香菇'],
    金针菇: ['金针菇'],
    平菇: ['平菇'],
    菜花: ['菜花', '花菜'],
    紫菜: ['紫菜'],
    虾皮: ['虾皮'],
    土豆: ['土豆', '马铃薯'],
    燕麦: ['燕麦', '燕麦片'],
    西兰花: ['西兰花', '绿花菜'],
    牛肉: ['牛肉', '牛里脊', '牛腩'],
    猪肉: ['猪肉', '瘦肉', '里脊肉', '肉片'],
    鸡肉: ['鸡肉', '鸡胸肉', '鸡腿肉', '鸡柳'],
    排骨: ['排骨', '猪骨'],
    冬瓜: ['冬瓜'],
    玉米: ['玉米', '玉米粒'],
    山药: ['山药'],
    莲藕: ['莲藕', '藕'],
    油麦菜: ['油麦菜'],
    青菜: ['青菜', '小青菜', '上海青'],
    生菜: ['生菜'],
    白菜: ['白菜', '大白菜'],
    包菜: ['包菜', '圆白菜', '卷心菜', '甘蓝'],
    娃娃菜: ['娃娃菜'],
    芹菜: ['芹菜', '西芹'],
    豆角: ['豆角', '四季豆', '芸豆'],
    茄子: ['茄子'],
    丝瓜: ['丝瓜'],
    苦瓜: ['苦瓜'],
    南瓜: ['南瓜'],
    西葫芦: ['西葫芦'],
    胡萝卜: ['胡萝卜'],
    海带: ['海带', '海带丝'],
    腐竹: ['腐竹'],
    粉丝: ['粉丝'],
    火腿: ['火腿', '火腿肠', '午餐肉'],
    虾仁: ['虾仁', '鲜虾'],
    鱼片: ['鱼片', '鱼柳'],
    豆芽: ['豆芽', '绿豆芽', '黄豆芽'],
    蒜: ['蒜', '蒜末', '蒜瓣'],
    葱: ['葱', '葱花', '小葱'],
    姜: ['姜', '姜片', '老姜'],
};
const PANTRY_QUERY_KEYWORDS = [
    '做什么菜',
    '做啥菜',
    '做哪些菜',
    '可以做什么',
    '可以做啥',
    '可以做哪些',
    '能做什么',
    '能做啥',
    '能做哪些',
    '做什么',
    '做啥',
    '做哪些',
    '怎么做',
    '吃什么',
    '怎么吃',
    '求菜谱',
    '求食谱',
    '菜谱推荐',
    '食谱推荐',
];
const PANTRY_NORMALIZE_PATTERN = /[\s，,。.!！?？、；;:：'"“”‘’（）()【】\[\]<>《》]/g;
const PANTRY_INGREDIENT_NOISE_PATTERN = /([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|ml|l|克|千克|毫升|升|斤)|[0-9]+(?:\.[0-9]+)?)|适量|少许|少量|若干|一把|适中|备用|即可|汤匙|茶匙|大勺|小勺|勺|把|个|根|片|朵|颗|只|块|碗|滴|杯/g;
const PANTRY_INGREDIENT_ACTION_PATTERN = /洗净|切块|切片|切丝|切段|切丁|焯水|提前浸泡|提前泡发|泡发|去皮|去核|去根|拍碎|打散|腌制|浸泡|备好|备用|切末/g;
const PANTRY_AUXILIARY_INGREDIENTS = new Set([
    '盐',
    '糖',
    '油',
    '食用油',
    '葱',
    '姜',
    '蒜',
    '料酒',
    '生抽',
    '老抽',
    '蚝油',
    '淀粉',
    '鸡精',
    '香油',
    '胡椒',
    '白胡椒',
    '黑胡椒',
    '冰糖',
    '红糖',
    '蜂蜜',
    '清水',
    '开水',
    '饮用水',
    '香醋',
    '陈醋',
    '米醋',
    '辣椒油',
].map((item) => normalizeIngredientToken(item)));
const PANTRY_SINGLE_CHAR_INGREDIENTS = new Set(['蒜', '姜', '葱'].map((item) => normalizeIngredientToken(item)));
const PANTRY_EXTENDED_INGREDIENT_ALIASES = (0, extended_ingredient_catalog_1.buildExtendedIngredientAliasMap)();
const PANTRY_BASE_INGREDIENT_ALIASES = mergeIngredientAliasMaps(PANTRY_EXTENDED_INGREDIENT_ALIASES, PANTRY_CORE_INGREDIENT_ALIASES);
const pantryBaseAliasLookup = buildAliasLookup(PANTRY_EXTENDED_INGREDIENT_ALIASES, PANTRY_CORE_INGREDIENT_ALIASES);
function normalizeIngredientToken(input) {
    return String(input || '').toLowerCase().replace(PANTRY_NORMALIZE_PATTERN, '');
}
function mergeIngredientAliasMaps(...sources) {
    const merged = new Map();
    sources.forEach((source) => {
        Object.entries(source || {}).forEach(([canonical, aliases]) => {
            if (!merged.has(canonical)) {
                merged.set(canonical, new Set());
            }
            const bucket = merged.get(canonical);
            if (!bucket)
                return;
            [canonical, ...(aliases || [])].forEach((alias) => {
                const token = String(alias || '').trim();
                if (token)
                    bucket.add(token);
            });
        });
    });
    const output = {};
    merged.forEach((aliases, canonical) => {
        output[canonical] = Array.from(aliases);
    });
    return output;
}
function buildAliasLookup(...sources) {
    const lookup = new Map();
    sources.forEach((source) => {
        Object.entries(source || {}).forEach(([canonical, aliases]) => {
            [canonical, ...(aliases || [])].forEach((alias) => {
                const token = normalizeIngredientToken(alias);
                if (token) {
                    lookup.set(token, canonical);
                }
            });
        });
    });
    return lookup;
}
function uniqueList(values) {
    return Array.from(new Set(values
        .map((item) => String(item || '').trim())
        .filter(Boolean)));
}
function sanitizeIngredientName(raw) {
    let text = String(raw || '').toLowerCase();
    if (!text)
        return '';
    text = text.replace(/[（(][^）)]*[）)]/g, '');
    text = text.replace(PANTRY_INGREDIENT_NOISE_PATTERN, '');
    text = text.replace(PANTRY_INGREDIENT_ACTION_PATTERN, '');
    return normalizeIngredientToken(text);
}
function canonicalizeIngredient(raw) {
    let token = sanitizeIngredientName(raw);
    if (!token)
        return '';
    const direct = pantryBaseAliasLookup.get(token);
    if (direct)
        return direct;
    if ((token.endsWith('末') || token.endsWith('片') || token.endsWith('丝')) && token.length <= 3) {
        token = token.slice(0, -1);
    }
    return pantryBaseAliasLookup.get(token) || token;
}
function normalizeRecipeIngredients(ingredients) {
    const normalized = ingredients
        .map((item) => canonicalizeIngredient(item))
        .filter(Boolean)
        .filter((item) => !PANTRY_AUXILIARY_INGREDIENTS.has(normalizeIngredientToken(item)));
    return uniqueList(normalized);
}
function buildRecipeDraft(name, type, time, ingredients, highlight, tags, priority) {
    const normalizedIngredients = normalizeRecipeIngredients(ingredients);
    return {
        name,
        type,
        time,
        ingredients: normalizedIngredients.length > 0 ? normalizedIngredients : uniqueList(ingredients),
        highlight,
        tags: uniqueList([...tags, ...normalizedIngredients, type]).slice(0, 8),
        priority,
    };
}
const PANTRY_SEED_RECIPES = [
    buildRecipeDraft('番茄炒蛋', '家常菜', '10分钟', ['番茄', '鸡蛋'], '经典快手，下饭稳妥。', ['快手', '家常'], 120),
    buildRecipeDraft('西红柿鸡蛋面', '早餐', '15分钟', ['番茄', '鸡蛋', '挂面'], '一锅搞定，早餐和夜宵都合适。', ['主食', '快手'], 120),
    buildRecipeDraft('番茄鸡蛋汤', '汤类', '10分钟', ['番茄', '鸡蛋'], '酸香开胃，清爽不腻。', ['清淡', '汤类'], 118),
    buildRecipeDraft('番茄鸡蛋豆腐汤', '汤类', '15分钟', ['番茄', '鸡蛋', '豆腐'], '蛋白质更足，口感嫩滑。', ['高蛋白', '汤类'], 118),
    buildRecipeDraft('番茄鸡蛋盖饭', '主食', '15分钟', ['番茄', '鸡蛋', '米饭'], '主食和配菜一盘搞定。', ['下饭', '主食'], 116),
    buildRecipeDraft('拍黄瓜', '凉菜', '5分钟', ['黄瓜'], '爽脆开胃，单有黄瓜也能立刻开做。', ['凉菜', '快手'], 125),
    buildRecipeDraft('凉拌黄瓜', '凉菜', '5分钟', ['黄瓜'], '清爽解腻，夏天很实用。', ['凉菜', '快手'], 124),
    buildRecipeDraft('黄瓜炒鸡蛋', '家常菜', '10分钟', ['黄瓜', '鸡蛋'], '口感脆嫩，家常又省事。', ['家常', '快手'], 120),
    buildRecipeDraft('黄瓜拌木耳', '凉菜', '8分钟', ['黄瓜', '木耳'], '脆爽有层次，配粥配饭都合适。', ['凉菜', '爽口'], 118),
    buildRecipeDraft('黄瓜拌豆腐', '凉菜', '8分钟', ['黄瓜', '豆腐'], '清淡高蛋白，适合晚餐轻食。', ['轻食', '高蛋白'], 117),
    buildRecipeDraft('黄瓜木耳炒蛋', '家常菜', '12分钟', ['黄瓜', '木耳', '鸡蛋'], '脆嫩和滑蛋搭配，营养均衡。', ['家常', '营养'], 116),
    buildRecipeDraft('黄瓜炒虾仁', '家常菜', '12分钟', ['黄瓜', '虾仁'], '鲜脆清爽，招待客人也体面。', ['鲜香', '快手'], 115),
    buildRecipeDraft('青椒土豆丝', '家常菜', '15分钟', ['青椒', '土豆'], '家常常备，清脆开胃。', ['家常', '快手'], 120),
    buildRecipeDraft('酸辣土豆丝', '家常菜', '12分钟', ['土豆'], '只要有土豆就能做出开胃口感。', ['开胃', '家常'], 118),
    buildRecipeDraft('蒜蓉西兰花', '家常菜', '10分钟', ['西兰花'], '少油快炒，清爽低负担。', ['清爽', '快手'], 119),
    buildRecipeDraft('西兰花炒虾仁', '家常菜', '15分钟', ['西兰花', '虾仁'], '配色好看，口感也清爽。', ['鲜香', '高蛋白'], 117),
    buildRecipeDraft('西兰花炒鸡胸肉', '家常菜', '15分钟', ['西兰花', '鸡肉'], '高蛋白思路友好，减脂期常见。', ['高蛋白', '轻负担'], 116),
    buildRecipeDraft('木耳炒鸡蛋', '家常菜', '12分钟', ['木耳', '鸡蛋'], '脆嫩顺口，材料很常见。', ['家常', '快手'], 118),
    buildRecipeDraft('洋葱炒鸡蛋', '家常菜', '10分钟', ['洋葱', '鸡蛋'], '甜香下饭，做法稳定。', ['下饭', '快手'], 118),
    buildRecipeDraft('西葫芦炒鸡蛋', '家常菜', '12分钟', ['西葫芦', '鸡蛋'], '清甜家常，操作简单。', ['家常', '清爽'], 117),
    buildRecipeDraft('青椒炒鸡蛋', '家常菜', '12分钟', ['青椒', '鸡蛋'], '经典快手菜，配饭省心。', ['家常', '快手'], 117),
    buildRecipeDraft('丝瓜炒鸡蛋', '家常菜', '12分钟', ['丝瓜', '鸡蛋'], '口感嫩滑，适合夏季家常。', ['家常', '清爽'], 116),
    buildRecipeDraft('香菇青菜', '素食', '8分钟', ['香菇', '青菜'], '清淡爽口，蔬菜占比高。', ['清淡', '素食'], 116),
    buildRecipeDraft('菠菜鸡蛋汤', '汤类', '10分钟', ['菠菜', '鸡蛋'], '简单省时，晚餐搭配友好。', ['清淡', '汤类'], 116),
    buildRecipeDraft('冬瓜虾皮汤', '汤类', '10分钟', ['冬瓜', '虾皮'], '清爽鲜味足，夏天很常见。', ['清淡', '快手'], 115),
    buildRecipeDraft('紫菜蛋花汤', '汤类', '8分钟', ['紫菜', '鸡蛋'], '鲜味足，厨房新手也能做。', ['汤类', '快手'], 117),
    buildRecipeDraft('番茄炖豆腐', '素食', '15分钟', ['番茄', '豆腐'], '酸甜开胃，清淡下饭。', ['清淡', '素食'], 115),
    buildRecipeDraft('茄子烧豆腐', '家常菜', '18分钟', ['茄子', '豆腐'], '软嫩入味，适合配米饭。', ['下饭', '家常'], 114),
    buildRecipeDraft('豆角炒肉末', '家常菜', '15分钟', ['豆角', '猪肉'], '家常感很强，拌饭也好吃。', ['下饭', '家常'], 114),
    buildRecipeDraft('芹菜炒牛肉', '家常菜', '15分钟', ['芹菜', '牛肉'], '脆嫩清香，餐馆也常见。', ['高蛋白', '家常'], 114),
    buildRecipeDraft('莲藕排骨汤', '汤类', '60分钟', ['莲藕', '排骨'], '经典炖汤组合，适合家常慢炖。', ['炖汤', '家常'], 112),
    buildRecipeDraft('玉米排骨汤', '汤类', '60分钟', ['玉米', '排骨'], '甜润顺口，家里常炖。', ['炖汤', '家常'], 112),
    buildRecipeDraft('冬瓜排骨汤', '汤类', '60分钟', ['冬瓜', '排骨'], '清爽不腻，适合日常搭配。', ['炖汤', '清淡'], 112),
    buildRecipeDraft('包菜炒粉丝', '家常菜', '15分钟', ['包菜', '粉丝'], '省事顶饱，很适合快手晚餐。', ['快手', '主食'], 113),
    buildRecipeDraft('白菜炖豆腐', '家常菜', '18分钟', ['白菜', '豆腐'], '清淡温和，冬天很实用。', ['家常', '清淡'], 113),
    buildRecipeDraft('娃娃菜粉丝煲', '家常菜', '18分钟', ['娃娃菜', '粉丝'], '暖胃顺口，适合做一锅菜。', ['暖胃', '家常'], 112),
    buildRecipeDraft('黄瓜火腿炒蛋', '家常菜', '12分钟', ['黄瓜', '火腿', '鸡蛋'], '三样食材就能做出层次感。', ['快手', '下饭'], 115),
    buildRecipeDraft('番茄牛肉面', '主食', '18分钟', ['番茄', '牛肉', '挂面'], '酸香浓郁，主食型满足感强。', ['主食', '一锅出'], 113),
    buildRecipeDraft('青椒肉丝', '家常菜', '15分钟', ['青椒', '猪肉'], '经典下饭菜，命中率很高。', ['下饭', '家常'], 115),
    buildRecipeDraft('苦瓜炒蛋', '家常菜', '12分钟', ['苦瓜', '鸡蛋'], '微苦回甘，家常做法成熟。', ['家常', '清爽'], 112),
    buildRecipeDraft('丝瓜豆腐汤', '汤类', '12分钟', ['丝瓜', '豆腐'], '汤色清爽，适合夏天晚餐。', ['清淡', '汤类'], 112),
    buildRecipeDraft('生菜蚝油炒香菇', '素食', '10分钟', ['生菜', '香菇'], '清脆和鲜香组合，出锅很快。', ['快手', '素食'], 111),
];
const coldVegetables = ['黄瓜', '莲藕', '木耳', '西兰花', '菠菜', '海带', '豆芽', '生菜', '白菜', '娃娃菜'];
const quickVegetables = [
    '黄瓜',
    '番茄',
    '青椒',
    '洋葱',
    '西兰花',
    '土豆',
    '菠菜',
    '香菇',
    '金针菇',
    '平菇',
    '菜花',
    '冬瓜',
    '玉米',
    '山药',
    '莲藕',
    '油麦菜',
    '青菜',
    '生菜',
    '白菜',
    '包菜',
    '娃娃菜',
    '芹菜',
    '豆角',
    '茄子',
    '丝瓜',
    '苦瓜',
    '南瓜',
    '西葫芦',
    '胡萝卜',
    '海带',
    '豆芽',
];
const eggFriendlyVegetables = [
    '黄瓜',
    '番茄',
    '洋葱',
    '青椒',
    '菠菜',
    '香菇',
    '金针菇',
    '菜花',
    '冬瓜',
    '丝瓜',
    '苦瓜',
    '南瓜',
    '西葫芦',
    '胡萝卜',
    '豆角',
    '木耳',
    '芹菜',
    '青菜',
];
const tofuFriendlyVegetables = [
    '番茄',
    '黄瓜',
    '青椒',
    '香菇',
    '金针菇',
    '菜花',
    '冬瓜',
    '莲藕',
    '白菜',
    '包菜',
    '娃娃菜',
    '丝瓜',
    '茄子',
    '海带',
    '豆芽',
    '菠菜',
    '南瓜',
    '西葫芦',
];
const soupVegetables = [
    '番茄',
    '黄瓜',
    '冬瓜',
    '丝瓜',
    '菠菜',
    '紫菜',
    '香菇',
    '金针菇',
    '白菜',
    '娃娃菜',
    '海带',
    '玉米',
    '山药',
    '莲藕',
];
const stapleVegetables = [
    '番茄',
    '青椒',
    '洋葱',
    '黄瓜',
    '香菇',
    '金针菇',
    '西兰花',
    '土豆',
    '白菜',
    '包菜',
    '娃娃菜',
    '豆角',
    '茄子',
    '南瓜',
    '西葫芦',
    '胡萝卜',
];
const stirPartnerDisplay = {
    鸡蛋: '鸡蛋',
    豆腐: '豆腐',
    猪肉: '肉片',
    牛肉: '牛肉',
    鸡肉: '鸡片',
    虾仁: '虾仁',
    火腿: '火腿',
    香菇: '香菇',
    木耳: '木耳',
    金针菇: '金针菇',
    腐竹: '腐竹',
    豆芽: '豆芽',
};
const staplePartnerDisplay = {
    鸡蛋: '鸡蛋',
    豆腐: '豆腐',
    猪肉: '肉片',
    牛肉: '牛肉',
    鸡肉: '鸡肉',
    虾仁: '虾仁',
    火腿: '火腿',
};
const stirPartners = ['鸡蛋', '豆腐', '猪肉', '牛肉', '鸡肉', '虾仁', '火腿', '香菇', '木耳', '金针菇', '腐竹', '豆芽'];
const staplePartners = ['鸡蛋', '豆腐', '猪肉', '牛肉', '鸡肉', '虾仁', '火腿'];
const soupPartners = ['鸡蛋', '豆腐', '虾皮', '排骨'];
const fillerStirStyles = [
    { suffix: '小炒', type: '家常菜', time: '12分钟', highlight: '两样主食材就能起锅，家常很稳。', priority: 28 },
    { suffix: '快炒', type: '家常菜', time: '10分钟', highlight: '快手思路友好，适合工作日晚餐。', priority: 26 },
    { suffix: '家常炒', type: '家常菜', time: '15分钟', highlight: '口味熟悉，适合配米饭。', priority: 24 },
];
const fillerStapleStyles = [
    { suffix: '盖饭', type: '主食', time: '18分钟', highlight: '主食配菜一份解决，省时省心。', priority: 24 },
    { suffix: '焖面', type: '主食', time: '20分钟', highlight: '一锅出餐，适合家常便捷做法。', priority: 23 },
    { suffix: '炒饭', type: '主食', time: '15分钟', highlight: '适合消耗剩饭，饱腹感更强。', priority: 22 },
];
const fillerSoupStyles = [
    { suffix: '汤', type: '汤类', time: '12分钟', highlight: '清爽易做，适合和主食搭配。', priority: 22 },
    { suffix: '汤羹', type: '汤类', time: '15分钟', highlight: '口感更顺口，家里老人孩子也容易接受。', priority: 21 },
];
function registerRecipe(recipeMap, draft) {
    const name = String(draft.name || '').trim();
    if (!name || recipeMap.has(name))
        return;
    const ingredients = normalizeRecipeIngredients(Array.isArray(draft.ingredients) ? draft.ingredients : []);
    if (ingredients.length === 0)
        return;
    recipeMap.set(name, {
        id: draft.id || `pantry_${recipeMap.size + 1}`,
        name,
        type: String(draft.type || '家常菜'),
        time: String(draft.time || '15分钟'),
        ingredients,
        highlight: String(draft.highlight || '快手家常，适合日常搭配。'),
        tags: uniqueList([...(draft.tags || []), ...ingredients, String(draft.type || '家常菜')]).slice(0, 8),
        priority: Number.isFinite(draft.priority) ? draft.priority : 20,
    });
}
function buildGeneratedPantryRecipes() {
    const recipeMap = new Map();
    PANTRY_SEED_RECIPES.forEach((recipe) => registerRecipe(recipeMap, recipe));
    coldVegetables.forEach((veg) => {
        registerRecipe(recipeMap, buildRecipeDraft(`凉拌${veg}`, '凉菜', '5分钟', [veg], '清爽开胃，单一主食材也能快速成菜。', ['凉菜', '快手'], 90));
        registerRecipe(recipeMap, buildRecipeDraft(`${veg}拌木耳`, '凉菜', '8分钟', [veg, '木耳'], '脆爽口感更丰富，适合夏季。', ['凉菜', '爽口'], 70));
        registerRecipe(recipeMap, buildRecipeDraft(`${veg}拌豆腐`, '凉菜', '8分钟', [veg, '豆腐'], '清淡高蛋白，轻食感更强。', ['凉菜', '轻食'], 68));
        registerRecipe(recipeMap, buildRecipeDraft(`${veg}拌粉丝`, '凉菜', '10分钟', [veg, '粉丝'], '简单顶饱，适合做凉拌小菜。', ['凉菜', '爽口'], 66));
    });
    quickVegetables.forEach((veg) => {
        registerRecipe(recipeMap, buildRecipeDraft(`清炒${veg}`, '素食', '8分钟', [veg], '做法直接，适合想快点上桌的场景。', ['素食', '快手'], 62));
        registerRecipe(recipeMap, buildRecipeDraft(`蒜蓉${veg}`, '素食', '8分钟', [veg], '蒜香思路常见，操作难度低。', ['素食', '家常'], 61));
    });
    eggFriendlyVegetables.forEach((veg) => {
        registerRecipe(recipeMap, buildRecipeDraft(`${veg}炒鸡蛋`, '家常菜', '12分钟', [veg, '鸡蛋'], '经典双拼思路，厨房容错率高。', ['家常', '快手'], 74));
        registerRecipe(recipeMap, buildRecipeDraft(`${veg}鸡蛋汤`, '汤类', '10分钟', [veg, '鸡蛋'], '热汤快手方案，适合搭配米饭。', ['汤类', '清淡'], 66));
        registerRecipe(recipeMap, buildRecipeDraft(`${veg}鸡蛋饼`, '早餐', '15分钟', [veg, '鸡蛋'], '早餐友好，饱腹感更稳。', ['早餐', '快手'], 58));
    });
    tofuFriendlyVegetables.forEach((veg) => {
        registerRecipe(recipeMap, buildRecipeDraft(`${veg}烧豆腐`, '家常菜', '15分钟', [veg, '豆腐'], '清淡里带点下饭感，家常很常见。', ['家常', '豆制品'], 70));
        registerRecipe(recipeMap, buildRecipeDraft(`${veg}豆腐汤`, '汤类', '12分钟', [veg, '豆腐'], '清爽顺口，晚餐搭配很合适。', ['汤类', '清淡'], 64));
        registerRecipe(recipeMap, buildRecipeDraft(`${veg}炒豆腐`, '家常菜', '12分钟', [veg, '豆腐'], '双素菜思路稳定，也方便补蛋白。', ['家常', '轻食'], 63));
    });
    soupVegetables.forEach((veg) => {
        soupPartners.forEach((partner) => {
            fillerSoupStyles.forEach((style) => {
                registerRecipe(recipeMap, buildRecipeDraft(`${veg}${partner}${style.suffix}`, style.type, style.time, [veg, partner], style.highlight, ['汤类', veg, partner], style.priority));
            });
        });
    });
    stapleVegetables.forEach((veg) => {
        staplePartners.forEach((partner) => {
            fillerStapleStyles.forEach((style) => {
                registerRecipe(recipeMap, buildRecipeDraft(`${veg}${staplePartnerDisplay[partner] || partner}${style.suffix}`, style.type, style.time, [veg, partner, style.suffix === '炒饭' || style.suffix === '盖饭' ? '米饭' : '挂面'], style.highlight, ['主食', veg, partner], style.priority));
            });
        });
    });
    quickVegetables.forEach((veg) => {
        stirPartners.forEach((partner) => {
            fillerStirStyles.forEach((style) => {
                registerRecipe(recipeMap, buildRecipeDraft(`${veg}${stirPartnerDisplay[partner] || partner}${style.suffix}`, style.type, style.time, [veg, partner], style.highlight, ['家常', veg, partner], style.priority));
            });
        });
    });
    if (recipeMap.size < TARGET_PANTRY_RECIPE_COUNT) {
        const fillerCombos = [
            { suffix: '拼盘', type: '家常菜', time: '16分钟', highlight: '双主料组合，适合家常混搭。', priority: 18 },
            { suffix: '暖锅', type: '家常菜', time: '20分钟', highlight: '做一锅更省事，适合日常晚餐。', priority: 17 },
            { suffix: '焖菜', type: '家常菜', time: '18分钟', highlight: '中火焖一焖，口味更融合。', priority: 17 },
            { suffix: '烩饭', type: '主食', time: '20分钟', highlight: '主食一起做，饱腹更稳。', priority: 16 },
        ];
        outer: for (const veg of quickVegetables) {
            for (const partner of stirPartners) {
                for (const style of fillerCombos) {
                    registerRecipe(recipeMap, buildRecipeDraft(`${veg}${stirPartnerDisplay[partner] || partner}${style.suffix}`, style.type, style.time, [veg, partner], style.highlight, [style.type, veg, partner], style.priority));
                    if (recipeMap.size >= TARGET_PANTRY_RECIPE_COUNT) {
                        break outer;
                    }
                }
            }
        }
    }
    return Array.from(recipeMap.values());
}
exports.PANTRY_RECIPES = buildGeneratedPantryRecipes();
const pantryAliasEntries = Array.from(pantryBaseAliasLookup.entries())
    .map(([alias, canonical]) => ({
    canonical,
    alias,
}))
    .filter((item) => {
    if (!item.alias)
        return false;
    if (item.alias.length >= 2)
        return true;
    const canonicalToken = normalizeIngredientToken(item.canonical);
    return PANTRY_SINGLE_CHAR_INGREDIENTS.has(canonicalToken) && item.alias === canonicalToken;
})
    .sort((a, b) => b.alias.length - a.alias.length);
function extractIngredientsFromMessage(message) {
    const normalized = normalizeIngredientToken(message);
    if (!normalized)
        return [];
    const found = new Set();
    for (const entry of pantryAliasEntries) {
        if (normalized.includes(entry.alias)) {
            found.add(entry.canonical);
        }
    }
    const sorted = Array.from(found).sort((a, b) => normalizeIngredientToken(b).length - normalizeIngredientToken(a).length);
    const compact = [];
    sorted.forEach((item) => {
        const token = normalizeIngredientToken(item);
        const covered = compact.some((kept) => {
            const keptToken = normalizeIngredientToken(kept);
            return keptToken !== token && keptToken.includes(token);
        });
        if (!covered) {
            compact.push(item);
        }
    });
    return compact;
}
function isPantryQuery(message, ingredients) {
    if (ingredients.length === 0)
        return false;
    const normalized = normalizeIngredientToken(message);
    const hasIntent = PANTRY_QUERY_KEYWORDS.some((keyword) => normalized.includes(normalizeIngredientToken(keyword)));
    const hasInventoryHint = normalized.includes('有') || normalized.includes('剩') || normalized.includes('冰箱');
    return hasIntent || (hasInventoryHint && ingredients.length >= 2);
}
function findPantryMatches(ingredients) {
    const owned = new Set(ingredients.map((item) => canonicalizeIngredient(item)).filter(Boolean));
    const scored = exports.PANTRY_RECIPES.map((recipe) => {
        const hits = recipe.ingredients.filter((ingredient) => owned.has(ingredient));
        const missing = recipe.ingredients.filter((ingredient) => !owned.has(ingredient));
        const coverageScore = recipe.ingredients.length > 0 ? Math.round((hits.length / recipe.ingredients.length) * 20) : 0;
        const score = recipe.priority + hits.length * 14 + coverageScore - missing.length * 6;
        return {
            ...recipe,
            hitCount: hits.length,
            missing,
            score,
        };
    }).filter((item) => item.hitCount >= 1);
    const full = scored
        .filter((item) => item.missing.length === 0)
        .sort((a, b) => b.score - a.score || b.hitCount - a.hitCount || a.name.localeCompare(b.name, 'zh-Hans-CN'))
        .slice(0, 8);
    const partial = scored
        .filter((item) => item.missing.length > 0 && item.hitCount >= Math.min(2, ingredients.length))
        .sort((a, b) => b.hitCount - a.hitCount || a.missing.length - b.missing.length || b.score - a.score || a.name.localeCompare(b.name, 'zh-Hans-CN'))
        .slice(0, 10);
    return { full, partial };
}
function buildPantryQueryResult(message) {
    const ingredients = extractIngredientsFromMessage(message);
    if (!isPantryQuery(message, ingredients)) {
        return {
            isPantryQuery: false,
            ingredients,
            full: [],
            partial: [],
        };
    }
    const { full, partial } = findPantryMatches(ingredients);
    return {
        isPantryQuery: true,
        ingredients,
        full,
        partial,
    };
}
function buildPantryRecipeSuggestion(message) {
    const query = buildPantryQueryResult(message);
    if (!query.isPantryQuery)
        return null;
    const ownedText = query.ingredients.join('、');
    if (query.full.length === 0 && query.partial.length === 0) {
        const ideaLines = buildGenericDishIdeas(query.ingredients);
        const suggestedBasics = ['鸡蛋', '豆腐', '猪肉', '鸡肉', '虾仁'].filter((item) => !query.ingredients.includes(item)).slice(0, 3);
        const basicText = suggestedBasics.length > 0 ? suggestedBasics.join('、') : '蛋白类食材';
        return [
            `你现在有「${ownedText}」。我先按通用家常做法给你一版“马上能做”的方向：`,
            '',
            '【快速菜式建议】',
            ...ideaLines.map((line, index) => `${index + 1}. ${line}`),
            '',
            `如果再补 ${basicText} 之一，我还能给你更贴合的“现有食材可直接做”清单。`,
        ].join('\n');
    }
    const lines = [];
    lines.push(`你现在有「${ownedText}」，我先按现有食材给你筛了一版。当前食材库已支持 ${exports.PANTRY_RECIPES.length} 道常见菜搭配：`);
    if (query.full.length > 0) {
        lines.push('');
        lines.push('【现有食材可直接做】');
        query.full.slice(0, 6).forEach((item, index) => {
            lines.push(`${index + 1}. ${item.name}（${item.type}，${item.time}）`);
            lines.push(`   - ${item.highlight}`);
        });
    }
    if (query.partial.length > 0) {
        lines.push('');
        lines.push(query.full.length > 0 ? '【再补 1-2 样食材可做】' : '【按现有食材最匹配】');
        query.partial.slice(0, query.full.length > 0 ? 5 : 7).forEach((item, index) => {
            lines.push(`${index + 1}. ${item.name}（缺：${item.missing.join('、')}）`);
            lines.push(`   - ${item.highlight}`);
        });
    }
    lines.push('');
    lines.push('如果你愿意，我还能继续按“清淡 / 减脂 / 高蛋白 / 下饭”再帮你缩一版。');
    return lines.join('\n');
}
function buildGenericDishIdeas(ingredients) {
    const ideas = [];
    ingredients.slice(0, 3).forEach((ingredient) => {
        const isFruit = /(苹果|香蕉|梨|橙|柚|柠檬|葡萄|草莓|蓝莓|桃|芒果|木瓜|火龙果|榴莲|西瓜|哈密瓜|牛油果|百香果|杨梅|柿子|枣|梅子|菠萝|凤梨|荔枝|龙眼)/.test(ingredient);
        const isBakeryDairy = /(奶酪|牛奶|酸奶|黄油|奶油|贝果|面包|吐司|炼乳|芝士)/.test(ingredient);
        const isProtein = /(鱼|虾|蟹|贝|肉|鸡|鸭|鹅|牛腩|羊|排骨|蛋|肝|肚|腱|里脊)/.test(ingredient);
        if (isFruit) {
            ideas.push(`${ingredient}水果沙拉`);
            ideas.push(`${ingredient}酸奶杯`);
            ideas.push(`${ingredient}果昔`);
            return;
        }
        if (isBakeryDairy) {
            ideas.push(`${ingredient}三明治`);
            ideas.push(`${ingredient}烘烤拼盘`);
            ideas.push(`${ingredient}早餐碗`);
            return;
        }
        if (isProtein) {
            ideas.push(`香煎${ingredient}`);
            if (!ingredient.includes('蛋')) {
                ideas.push(`${ingredient}炒蛋`);
            }
            ideas.push(`${ingredient}豆腐汤`);
            ideas.push(`${ingredient}蔬菜煮`);
            return;
        }
        ideas.push(`清炒${ingredient}`);
        if (!ingredient.includes('蛋')) {
            ideas.push(`${ingredient}炒蛋`);
        }
        if (!ingredient.includes('豆腐')) {
            ideas.push(`${ingredient}豆腐汤`);
        }
        ideas.push(`${ingredient}肉片快炒`);
    });
    return uniqueList(ideas).slice(0, 8);
}
function getPantryRecipeLibraryStats() {
    return {
        count: exports.PANTRY_RECIPES.length,
        ingredientAliasCount: pantryAliasEntries.length,
    };
}
//# sourceMappingURL=pantry-recipe.service.js.map