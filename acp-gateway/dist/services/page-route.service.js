"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageRouteService = exports.PageRouteService = void 0;
const defaultRoutes = [
    { id: 'health-profile', name: '精准健康', url: '/pages/health-profile/index.html', keywords: ['精准健康', '健康档案', '完善资料', '健康信息'], icon: '📋', enabled: true, priority: 1 },
    { id: 'report-analysis', name: '体检报告分析', url: '/pages/report-analysis/index.html', keywords: ['体检报告', '报告分析', '查看报告', '上传报告'], icon: '📊', enabled: true, priority: 2 },
    { id: 'recipe', name: '健康食谱', url: '/pages/recipe/list.html', keywords: ['食谱', '菜谱', '吃什么', '做菜'], icon: '🍽️', enabled: true, priority: 3 },
    { id: 'exercise', name: '运动课程', url: '/pages/exercise/list.html', keywords: ['运动', '健身', '跑步', '锻炼', '减肥'], icon: '💪', enabled: true, priority: 4 },
    { id: 'mall', name: '商城', url: '/pages/mall/index.html', keywords: ['商城', '购物', '买', '商品'], icon: '🛒', enabled: true, priority: 5 },
    { id: 'profile', name: '我的', url: '/pages/profile/index.html', keywords: ['我的', '个人中心', '账户'], icon: '👤', enabled: true, priority: 6 },
    { id: 'store', name: '门店', url: '/pages/store/list.html', keywords: ['门店', '药店', '地址', '在哪里'], icon: '🏪', enabled: true, priority: 7 },
    { id: 'psychology', name: '心理课程', url: '/pages/psychology/list.html', keywords: ['心理', '压力', '焦虑', '情绪'], icon: '🧠', enabled: true, priority: 8 },
    { id: 'sleep', name: '睡眠课程', url: '/pages/sleep/list.html', keywords: ['睡眠', '失眠', '入睡'], icon: '😴', enabled: true, priority: 9 },
];
class PageRouteService {
    constructor() {
        this.routes = new Map();
        defaultRoutes.forEach(route => {
            this.routes.set(route.id, route);
        });
    }
    detectRouteIntent(message) {
        const lowerMessage = message.toLowerCase();
        for (const route of this.routes.values()) {
            if (!route.enabled)
                continue;
            for (const keyword of route.keywords) {
                if (lowerMessage.includes(keyword)) {
                    return route;
                }
            }
        }
        return null;
    }
    getRouteById(id) {
        return this.routes.get(id) || null;
    }
    getAllRoutes() {
        return Array.from(this.routes.values())
            .filter(r => r.enabled)
            .sort((a, b) => a.priority - b.priority);
    }
    getRecommendedRoutes(message, limit = 3) {
        const matched = this.detectRouteIntent(message);
        if (matched) {
            return [matched];
        }
        // Return default routes if no match
        return this.getAllRoutes().slice(0, limit);
    }
    updateRoute(id, updates) {
        const route = this.routes.get(id);
        if (!route)
            return false;
        this.routes.set(id, { ...route, ...updates });
        return true;
    }
    addRoute(route) {
        this.routes.set(route.id, route);
    }
    deleteRoute(id) {
        return this.routes.delete(id);
    }
}
exports.PageRouteService = PageRouteService;
exports.pageRouteService = new PageRouteService();
//# sourceMappingURL=page-route.service.js.map