"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExtendedIngredientAliasMap = buildExtendedIngredientAliasMap;
exports.getExtendedIngredientCatalogStats = getExtendedIngredientCatalogStats;
function parseIngredientBlock(block) {
    const values = String(block || '')
        .split(/[\s,，、;；]+/g)
        .map((item) => item.trim())
        .filter(Boolean);
    return Array.from(new Set(values));
}
function toDefinitions(items, category) {
    return items.map((canonical) => ({ canonical, category }));
}
const VEGETABLES = parseIngredientBlock(`
  白菜 小白菜 娃娃菜 奶白菜 黄心菜 鸡毛菜 上海青 油菜 油麦菜 生菜 西生菜 苦菊 芝麻菜
  菠菜 茼蒿 空心菜 苋菜 马兰头 荠菜 芥蓝 菜心 西洋菜 羽衣甘蓝 红菜苔 菜苔 芹菜 西芹 莴笋 莴苣
  茭白 芦笋 竹笋 春笋 冬笋 香椿 韭菜 韭黄 蒜苔 蒜苗 蒜黄 大葱 小葱 香葱 洋葱 紫洋葱
  姜 老姜 嫩姜 蒜 蒜瓣 香菜 芫荽 紫苏 薄荷 罗勒 迷迭香 百里香 牛至
  番茄 西红柿 小番茄 圣女果 茄子 圆茄 长茄 紫茄 青椒 红椒 黄椒 彩椒 尖椒 线椒 杭椒 二荆条 朝天椒 小米椒
  黄瓜 青瓜 冬瓜 南瓜 贝贝南瓜 苦瓜 丝瓜 西葫芦 瓠瓜 节瓜 佛手瓜 蛇瓜
  土豆 马铃薯 红薯 紫薯 山药 芋头 芋艿 胡萝卜 白萝卜 青萝卜 红萝卜 樱桃萝卜 牛蒡 荸荠 马蹄 莲藕 藕带
  玉米 甜玉米 糯玉米 玉米笋 荷兰豆 豌豆 豌豆苗 毛豆 四季豆 豆角 豇豆 扁豆 刀豆 芸豆 蚕豆 青豆 豆苗
  西兰花 花菜 菜花 包菜 卷心菜 紫甘蓝 抱子甘蓝 洋白菜
  秋葵 木薯 菱角 百合
  海带 海带丝 裙带菜 紫菜
`);
const MUSHROOMS = parseIngredientBlock(`
  香菇 鲜香菇 花菇 平菇 杏鲍菇 金针菇 白玉菇 蟹味菇 海鲜菇 口蘑 蘑菇 双孢菇 草菇
  鸡腿菇 茶树菇 秀珍菇 竹荪 羊肚菌 牛肝菌 松茸 鸡枞菌 红菇 鹿茸菇 榛蘑 榆黄菇
  黑木耳 木耳 银耳 猴头菇 灵芝 虫草花 姬松茸
`);
const FISH = parseIngredientBlock(`
  鲫鱼 鲤鱼 草鱼 青鱼 鲢鱼 鳙鱼 鲈鱼 海鲈 罗非鱼 黑鱼 乌鳢 鳗鱼 黄鳝 泥鳅
  黄花鱼 小黄鱼 大黄鱼 带鱼 秋刀鱼 沙丁鱼 金枪鱼 三文鱼 鳕鱼 银鳕鱼 比目鱼 多宝鱼
  鲳鱼 鲭鱼 马鲛鱼 巴沙鱼 龙利鱼 石斑鱼 鲷鱼 真鲷 鲽鱼 鲆鱼 鲟鱼 鲨鱼
  鱼头 鱼尾 鱼排 鱼柳 鱼片 鱼段 鱼块
`);
const SHELLFISH = parseIngredientBlock(`
  虾 河虾 青虾 基围虾 明虾 对虾 斑节虾 北极甜虾 南美白虾 皮皮虾 濑尿虾 虾仁 虾滑 虾球
  蟹 花蟹 青蟹 梭子蟹 河蟹 大闸蟹 帝王蟹 雪蟹 蟹腿 蟹钳 蟹肉
  花甲 蛤蜊 文蛤 白蛤 青口 贻贝 扇贝 带子 干贝 生蚝 牡蛎 蛏子 海瓜子 海螺 螺肉 田螺
  鲍鱼 海参 海胆 鱿鱼 墨鱼 乌贼 章鱼 八爪鱼 海蜇 海蜇头
`);
const MEATS = parseIngredientBlock(`
  猪肉 瘦肉 五花肉 里脊肉 梅花肉 前腿肉 后腿肉 猪排骨 猪大骨 筒骨 猪蹄 猪脚 猪肘
  猪耳 猪舌 猪心 猪肝 猪肚 猪肠 猪血 猪脑 猪腰 猪皮 腊肉 火腿 培根 午餐肉
  牛肉 牛腩 牛腱 牛里脊 牛排 牛上脑 牛肩肉 牛尾 牛筋 牛肚 牛百叶 牛舌 牛心 牛肝 牛杂
  羊肉 羊排 羊腿 羊蝎子 羊肚 羊杂 羊腰
  鸡肉 鸡胸肉 鸡腿肉 鸡翅 鸡翅中 鸡翅根 鸡爪 鸡胗 鸡心 鸡肝 鸡架 老母鸡 三黄鸡 乌鸡 童子鸡
  鸭肉 老鸭 鸭腿 鸭翅 鸭掌 鸭胗 鸭肝 鸭肠 鸭血 鸭架
  鹅肉 鹅腿 鹅肝 鸽子 乳鸽 鹌鹑 兔肉 驴肉
  鸡蛋 鸭蛋 鹅蛋 鹌鹑蛋 皮蛋 咸蛋
`);
const BEANS_AND_GRAINS = parseIngredientBlock(`
  黄豆 黑豆 绿豆 红豆 赤小豆 芸豆 鹰嘴豆 扁豆 眉豆 花豆 豌豆
  豆腐 嫩豆腐 老豆腐 北豆腐 南豆腐 内酯豆腐 千张 百叶 豆皮 豆腐皮
  腐竹 豆泡 油豆腐 豆干 香干 豆腐干 豆腐丝 豆腐结 素鸡 豆浆 豆奶
  绿豆芽 黄豆芽
  大米 粳米 籼米 糯米 黑米 紫米 小米 黄米 高粱米 薏米 燕麦 燕麦片 荞麦 藜麦 青稞 大麦 小麦
  面粉 中筋面粉 高筋面粉 低筋面粉 全麦粉 糯米粉 玉米面 玉米糁
  玉米淀粉 红薯淀粉 土豆淀粉 木薯淀粉 生粉
  挂面 面条 拉面 刀削面 乌冬面 荞麦面 米线 米粉 河粉 粉丝 粉条 宽粉 凉皮
  年糕 糍粑 馄饨皮 饺子皮 春卷皮
  馒头 花卷 面包 吐司 贝果
  牛奶 纯牛奶 酸奶 奶酪 芝士 黄油 淡奶油 奶油奶酪 椰浆 椰奶
`);
const FRUITS = parseIngredientBlock(`
  苹果 香蕉 梨 雪梨 橙子 柚子 橘子 蜜橘 柠檬 青柠 葡萄 提子 草莓 蓝莓 树莓 黑莓 桑葚 樱桃 车厘子
  桃子 油桃 黄桃 李子 杏 枇杷 石榴 无花果 猕猴桃 奇异果 菠萝 凤梨 芒果 木瓜 火龙果 榴莲 山竹 荔枝 龙眼 桂圆
  椰子 椰青 西瓜 哈密瓜 甜瓜 香瓜 百香果 杨梅 杨桃 柿子 红枣 冬枣 酸枣 牛油果 莲雾 释迦 番石榴 甘蔗 梅子 青梅
`);
const SPICES = parseIngredientBlock(`
  盐 海盐 低钠盐 糖 白糖 红糖 冰糖 黑糖 蜂蜜 麦芽糖 枫糖浆
  生抽 老抽 酱油 蚝油 料酒 黄酒 米酒 醋 米醋 陈醋 香醋 白醋
  胡椒 黑胡椒 白胡椒 花椒 麻椒 孜然 孜然粉 辣椒粉 辣椒面
  豆瓣酱 黄豆酱 甜面酱 番茄酱 沙茶酱 蒜蓉酱 辣椒酱 甜辣酱 剁椒 泡椒
  咖喱 咖喱粉 咖喱块 五香粉 十三香 八角 桂皮 香叶 草果 丁香 小茴香
  鸡精 味精 鱼露 虾酱 豆豉 腐乳 火锅底料
  芝麻 白芝麻 黑芝麻 芝麻酱 花生酱
`);
const BASE_DEFINITIONS = [
    ...toDefinitions(VEGETABLES, 'vegetable'),
    ...toDefinitions(MUSHROOMS, 'mushroom'),
    ...toDefinitions(FISH, 'fish'),
    ...toDefinitions(SHELLFISH, 'shellfish'),
    ...toDefinitions(MEATS, 'meat'),
    ...toDefinitions(BEANS_AND_GRAINS, 'bean_grain'),
    ...toDefinitions(FRUITS, 'fruit'),
    ...toDefinitions(SPICES, 'spice'),
];
function buildDerivedDefinitions(definitions) {
    const derived = [];
    definitions.forEach((definition) => {
        const canonical = definition.canonical;
        const names = new Set();
        if (definition.category === 'vegetable') {
            names.add(`${canonical}丝`);
            names.add(`${canonical}片`);
        }
        if (definition.category === 'mushroom') {
            names.add(`${canonical}片`);
            names.add(`${canonical}丁`);
        }
        if (definition.category === 'fish') {
            const fishName = canonical.includes('鱼') ? canonical : `${canonical}鱼`;
            names.add(`${fishName}片`);
            names.add(`${fishName}段`);
            names.add(`${fishName}块`);
            names.add(`${fishName}柳`);
        }
        if (definition.category === 'shellfish') {
            if (canonical.endsWith('虾')) {
                names.add(`${canonical}仁`);
            }
            if (canonical.endsWith('蟹')) {
                names.add(`${canonical}腿`);
            }
            if (/贝|蛤|螺|蚝|牡蛎/.test(canonical)) {
                names.add(`${canonical}肉`);
            }
            if (canonical.endsWith('鱼')) {
                names.add(`${canonical}片`);
            }
        }
        if (definition.category === 'meat') {
            names.add(`${canonical}片`);
            names.add(`${canonical}丝`);
            names.add(`${canonical}丁`);
            names.add(`${canonical}末`);
            names.add(`${canonical}块`);
        }
        if (definition.category === 'bean_grain') {
            names.add(`${canonical}粉`);
            names.add(`${canonical}糊`);
        }
        if (definition.category === 'fruit') {
            names.add(`${canonical}丁`);
            names.add(`${canonical}块`);
        }
        names.forEach((name) => {
            if (name.length >= 2) {
                derived.push({
                    canonical: name,
                    category: definition.category,
                    aliases: [name],
                });
            }
        });
    });
    return derived;
}
const ALL_DEFINITIONS = [...BASE_DEFINITIONS, ...buildDerivedDefinitions(BASE_DEFINITIONS)];
const CATEGORY_PREFIXES = {
    vegetable: ['新鲜', '鲜'],
    mushroom: ['鲜', '干'],
    fish: ['鲜', '冷冻'],
    shellfish: ['鲜', '冷冻'],
    meat: ['新鲜', '冷冻'],
    bean_grain: ['干', '鲜'],
    fruit: ['新鲜'],
    spice: [],
};
function uniqueValues(values) {
    return Array.from(new Set(values.map((item) => String(item || '').trim()).filter(Boolean)));
}
function buildAutoAliases(definition) {
    const canonical = definition.canonical;
    const set = new Set([canonical, ...(definition.aliases || [])]);
    const prefixes = CATEGORY_PREFIXES[definition.category] || [];
    prefixes.forEach((prefix) => set.add(`${prefix}${canonical}`));
    if (definition.category === 'fish') {
        const fishName = canonical.includes('鱼') ? canonical : `${canonical}鱼`;
        set.add(fishName);
        set.add(`${fishName}片`);
        set.add(`${fishName}段`);
        set.add(`${fishName}块`);
        set.add(`${fishName}柳`);
    }
    if (definition.category === 'shellfish') {
        if (canonical.endsWith('虾')) {
            set.add(`${canonical}仁`);
            set.add(`${canonical}尾`);
        }
        if (canonical.endsWith('蟹')) {
            set.add(`${canonical}腿`);
            set.add(`${canonical}钳`);
        }
        if (/贝|蛤|螺|蚝|牡蛎/.test(canonical)) {
            set.add(`${canonical}肉`);
        }
    }
    if (definition.category === 'meat') {
        set.add(`${canonical}片`);
        set.add(`${canonical}丝`);
        set.add(`${canonical}丁`);
        set.add(`${canonical}末`);
        set.add(`${canonical}块`);
    }
    if (definition.category === 'vegetable') {
        set.add(`${canonical}丝`);
        set.add(`${canonical}片`);
        set.add(`${canonical}段`);
    }
    if (definition.category === 'mushroom') {
        set.add(`${canonical}片`);
    }
    return uniqueValues(Array.from(set).filter((alias) => alias.length >= 2));
}
function buildExtendedIngredientAliasMap() {
    const map = new Map();
    ALL_DEFINITIONS.forEach((definition) => {
        const canonical = definition.canonical;
        const aliases = buildAutoAliases(definition);
        if (!map.has(canonical)) {
            map.set(canonical, new Set());
        }
        const bucket = map.get(canonical);
        if (!bucket)
            return;
        aliases.forEach((alias) => bucket.add(alias));
    });
    const merged = {};
    map.forEach((aliases, canonical) => {
        merged[canonical] = Array.from(aliases);
    });
    return merged;
}
function getExtendedIngredientCatalogStats() {
    const aliasMap = buildExtendedIngredientAliasMap();
    const canonicalCount = Object.keys(aliasMap).length;
    const termCount = Object.values(aliasMap).reduce((sum, list) => sum + list.length, 0);
    return { canonicalCount, termCount };
}
//# sourceMappingURL=extended-ingredient-catalog.js.map