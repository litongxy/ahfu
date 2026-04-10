"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRecommendationService = exports.ContentRecommendationService = void 0;
// 内容库
const contentDatabase = [
    // 食谱
    { id: 'r1', type: 'recipe', title: '牛肉土豆杂蔬焖菜', description: '低脂高蛋白，适合减脂人群', imageUrl: '/images/r1.jpg', calories: 378, difficulty: 'easy', tags: ['减脂', '高蛋白', '低脂'], targetScenes: ['diet', 'report'] },
    { id: 'r2', type: 'recipe', title: '玉米鸡胸肉蔬菜焖面', description: '营养均衡的主食选择', imageUrl: '/images/r2.jpg', calories: 513, difficulty: 'easy', tags: ['均衡营养', '主食'], targetScenes: ['diet', 'report'] },
    { id: 'r3', type: 'recipe', title: '清蒸鲈鱼', description: '清淡鲜美，保护心血管', imageUrl: '/images/r3.jpg', calories: 180, difficulty: 'medium', tags: ['心血管', '清淡'], targetScenes: ['diet', 'disease'] },
    { id: 'r4', type: 'recipe', title: '山药排骨汤', description: '健脾养胃，滋补养生', imageUrl: '/images/r4.jpg', calories: 320, difficulty: 'medium', tags: ['养胃', '滋补'], targetScenes: ['diet', 'tcm'] },
    // 运动课程
    { id: 'e1', type: 'exercise', title: 'HIIT燃脂训练', description: '高效燃脂，20分钟见效', imageUrl: '/images/e1.jpg', duration: 20, difficulty: 'hard', tags: ['减脂', '高效'], targetScenes: ['exercise', 'report'] },
    { id: 'e2', type: 'exercise', title: '零基础健身入门', description: '适合初学者的健身课程', imageUrl: '/images/e2.jpg', duration: 30, difficulty: 'easy', tags: ['入门', '初学者'], targetScenes: ['exercise'] },
    { id: 'e3', type: 'exercise', title: '瑜伽放松', description: '舒缓压力，放松身心', imageUrl: '/images/e3.jpg', duration: 45, difficulty: 'easy', tags: ['放松', '减压'], targetScenes: ['exercise', 'psychology'] },
    { id: 'e4', type: 'exercise', title: '腹肌撕裂者', description: '核心训练，马甲线必备', imageUrl: '/images/e4.jpg', duration: 15, difficulty: 'hard', tags: ['腹肌', '核心'], targetScenes: ['exercise'] },
    // 心理课程
    { id: 'p1', type: 'psychology', title: '7天正念减压', description: '科学减压，缓解焦虑', imageUrl: '/images/p1.jpg', duration: 7 * 15, difficulty: 'easy', tags: ['减压', '焦虑'], targetScenes: ['psychology', 'sleep'] },
    { id: 'p2', type: 'psychology', title: '情绪管理课程', description: '学会管理情绪', imageUrl: '/images/p2.jpg', duration: 30, difficulty: 'medium', tags: ['情绪', '管理'], targetScenes: ['psychology'] },
    // 睡眠课程
    { id: 's1', type: 'sleep', title: '7天轻松入睡', description: '改善睡眠质量', imageUrl: '/images/s1.jpg', duration: 7 * 20, difficulty: 'easy', tags: ['失眠', '入睡'], targetScenes: ['sleep', 'psychology'] },
    { id: 's2', type: 'sleep', title: '深度睡眠指南', description: '提升睡眠深度', imageUrl: '/images/s2.jpg', duration: 45, difficulty: 'medium', tags: ['深度睡眠'], targetScenes: ['sleep'] },
];
// 商品库
const productDatabase = [
    { id: 'p1', name: '同仁堂西洋参片', category: '滋补养生', price: 298, originalPrice: 358, imageUrl: '/images/p1.jpg', description: '补气养阴，清热生津', tags: ['滋补', '养生'], targetScenes: ['tcm', 'antiaging'] },
    { id: 'p2', name: '同仁堂阿胶糕', category: '滋补养生', price: 168, imageUrl: '/images/p2.jpg', description: '补血养颜，滋阴润燥', tags: ['补血', '养颜'], targetScenes: ['tcm', 'diet'] },
    { id: 'p3', name: '蜂蜜礼盒', category: '养生食品', price: 89, imageUrl: '/images/p3.jpg', description: '天然蜂蜜，润肠通便', tags: ['蜂蜜', '润肠'], targetScenes: ['tcm', 'diet'] },
    { id: 'p4', name: '三七粉', category: '中药饮片', price: 198, imageUrl: '/images/p4.jpg', description: '活血化瘀，保护心血管', tags: ['心血管', '活血'], targetScenes: ['tcm', 'disease'] },
    { id: 'p5', name: '燕窝礼盒', category: '滋补养生', price: 599, originalPrice: 699, imageUrl: '/images/p5.jpg', description: '滋阴润肺，美容养颜', tags: ['燕窝', '养颜'], targetScenes: ['tcm', 'antiaging'] },
    { id: 'p6', name: '枸杞原浆', category: '养生食品', price: 128, imageUrl: '/images/p6.jpg', description: '明目养肝，增强免疫', tags: ['枸杞', '免疫'], targetScenes: ['tcm', 'diet'] },
];
class ContentRecommendationService {
    constructor() {
        this.contents = contentDatabase;
        this.products = productDatabase;
    }
    getContents(scene, limit = 3) {
        return this.contents
            .filter(c => c.targetScenes.includes(scene))
            .slice(0, limit);
    }
    getProducts(scene, limit = 2) {
        return this.products
            .filter(p => p.targetScenes.includes(scene))
            .slice(0, limit);
    }
    searchContents(keyword, limit = 5) {
        const lower = keyword.toLowerCase();
        return this.contents
            .filter(c => c.title.toLowerCase().includes(lower) ||
            c.description.toLowerCase().includes(lower) ||
            c.tags.some(t => t.includes(keyword)))
            .slice(0, limit);
    }
    searchProducts(keyword, limit = 5) {
        const lower = keyword.toLowerCase();
        return this.products
            .filter(p => p.name.toLowerCase().includes(lower) ||
            p.description.toLowerCase().includes(lower) ||
            p.tags.some(t => t.includes(keyword)))
            .slice(0, limit);
    }
    getContentById(id) {
        return this.contents.find(c => c.id === id);
    }
    getProductById(id) {
        return this.products.find(p => p.id === id);
    }
    getAllContents() {
        return this.contents;
    }
    getAllProducts() {
        return this.products;
    }
}
exports.ContentRecommendationService = ContentRecommendationService;
exports.contentRecommendationService = new ContentRecommendationService();
//# sourceMappingURL=content-recommendation.service.js.map