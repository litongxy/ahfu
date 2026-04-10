export interface PageRoute {
    id: string;
    name: string;
    url: string;
    keywords: string[];
    icon?: string;
    enabled: boolean;
    priority: number;
}
export declare class PageRouteService {
    private routes;
    constructor();
    detectRouteIntent(message: string): PageRoute | null;
    getRouteById(id: string): PageRoute | null;
    getAllRoutes(): PageRoute[];
    getRecommendedRoutes(message: string, limit?: number): PageRoute[];
    updateRoute(id: string, updates: Partial<PageRoute>): boolean;
    addRoute(route: PageRoute): void;
    deleteRoute(id: string): boolean;
}
export declare const pageRouteService: PageRouteService;
//# sourceMappingURL=page-route.service.d.ts.map