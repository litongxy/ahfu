"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeConfigRouter = void 0;
const express_1 = require("express");
const page_route_service_1 = require("../services/page-route.service");
const router = (0, express_1.Router)();
exports.routeConfigRouter = router;
router.get('/', (req, res) => {
    const routes = page_route_service_1.pageRouteService.getAllRoutes();
    res.json({
        code: 0,
        data: routes,
    });
});
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const route = page_route_service_1.pageRouteService.getRouteById(id);
    if (!route) {
        res.status(404).json({
            code: 404,
            message: 'Route not found',
        });
        return;
    }
    res.json({
        code: 0,
        data: route,
    });
});
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const success = page_route_service_1.pageRouteService.updateRoute(id, updates);
    if (!success) {
        res.status(404).json({
            code: 404,
            message: 'Route not found',
        });
        return;
    }
    res.json({
        code: 0,
        data: page_route_service_1.pageRouteService.getRouteById(id),
    });
});
router.post('/', (req, res) => {
    const route = req.body;
    if (!route.id || !route.name || !route.url) {
        res.status(400).json({
            code: 400,
            message: 'Missing required fields',
        });
        return;
    }
    page_route_service_1.pageRouteService.addRoute(route);
    res.json({
        code: 0,
        data: route,
    });
});
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const success = page_route_service_1.pageRouteService.deleteRoute(id);
    if (!success) {
        res.status(404).json({
            code: 404,
            message: 'Route not found',
        });
        return;
    }
    res.json({
        code: 0,
        message: 'Deleted successfully',
    });
});
//# sourceMappingURL=route-config.route.js.map