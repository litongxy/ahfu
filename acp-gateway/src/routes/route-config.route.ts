import { Router, Request, Response } from 'express';
import { pageRouteService } from '../services/page-route.service';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const routes = pageRouteService.getAllRoutes();
  res.json({
    code: 0,
    data: routes,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const route = pageRouteService.getRouteById(id);
  
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

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  
  const success = pageRouteService.updateRoute(id, updates);
  
  if (!success) {
    res.status(404).json({
      code: 404,
      message: 'Route not found',
    });
    return;
  }
  
  res.json({
    code: 0,
    data: pageRouteService.getRouteById(id),
  });
});

router.post('/', (req: Request, res: Response) => {
  const route = req.body;
  
  if (!route.id || !route.name || !route.url) {
    res.status(400).json({
      code: 400,
      message: 'Missing required fields',
    });
    return;
  }
  
  pageRouteService.addRoute(route);
  
  res.json({
    code: 0,
    data: route,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = pageRouteService.deleteRoute(id);
  
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

export { router as routeConfigRouter };