import { Router, Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { requireAuthIfEnabled } from '../middleware/auth.middleware';

const router = Router();
const recommendationService = new RecommendationService();

router.use(requireAuthIfEnabled);

function resolveListFromBody(body: unknown): unknown {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    const record = body as { items?: unknown };
    if (Array.isArray(record.items)) {
      return record.items;
    }
  }
  return body;
}

router.get('/recipes', async (_req: Request, res: Response) => {
  try {
    const list = await recommendationService.getStoredRecipes();
    res.json({
      code: 0,
      data: list,
    });
  } catch (error) {
    console.error('Get recipes failed:', error);
    res.status(500).json({
      code: 500,
      message: '读取食谱失败',
    });
  }
});

router.put('/recipes', async (req: Request, res: Response) => {
  try {
    const list = await recommendationService.saveStoredRecipes(resolveListFromBody(req.body));
    res.json({
      code: 0,
      data: list,
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error?.message || '更新食谱失败',
    });
  }
});

router.get('/exercise-videos', async (_req: Request, res: Response) => {
  try {
    const list = await recommendationService.getStoredExerciseVideos();
    res.json({
      code: 0,
      data: list,
    });
  } catch (error) {
    console.error('Get exercise videos failed:', error);
    res.status(500).json({
      code: 500,
      message: '读取运动视频失败',
    });
  }
});

router.put('/exercise-videos', async (req: Request, res: Response) => {
  try {
    const list = await recommendationService.saveStoredExerciseVideos(resolveListFromBody(req.body));
    res.json({
      code: 0,
      data: list,
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error?.message || '更新运动视频失败',
    });
  }
});

export { router as contentRouter };
