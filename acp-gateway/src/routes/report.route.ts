import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { reportService } from '../services/report.service';
import type { HealthReport } from '../services/report.model';
import { RecommendationService } from '../services/recommendation.service';
import { isUserScopeAllowed, requireAuth, resolveRequestUserId } from '../middleware/auth.middleware';
import { AuthTokenClaims } from '../services/auth-token.service';

const router = Router();
router.use(requireAuth);
type RequestWithAuth = Request & { auth?: AuthTokenClaims };
type ReportRecommendations = Awaited<ReturnType<RecommendationService['getRecommendations']>>;

const recommendationService = new RecommendationService();

const MOJIBAKE_FILENAME_PATTERN =
  /[\uFFFDÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿŒœŠšŽžƒˆ˜†‡•–—‘’‚“”„…‰‹›€™]/;

function decodeUploadOriginalName(originalName: string): string {
  if (!originalName) return originalName;
  const needsDecode = MOJIBAKE_FILENAME_PATTERN.test(originalName);
  if (!needsDecode) return originalName;

  try {
    const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
    if (!decoded) return originalName;
    return decoded;
  } catch {
    return originalName;
  }
}

async function buildReportRecommendations(report: HealthReport | null): Promise<ReportRecommendations | undefined> {
  if (!report) return undefined;

  try {
    return await recommendationService.getRecommendations('report', {
      userId: report.userId,
      report,
    });
  } catch (error) {
    console.error('Build report recommendations error:', error);
    return undefined;
  }
}

async function attachReportRecommendations<T extends object>(
  payload: T,
  report: HealthReport | null
): Promise<T & { recommendations?: ReportRecommendations }> {
  const recommendations = await buildReportRecommendations(report);
  if (!recommendations) {
    return payload;
  }

  return {
    ...payload,
    recommendations,
  };
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '../../uploads/reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `report-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 PDF、JPG、PNG 格式'));
    }
  }
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const requestedUserId = (req.query.userId as string | undefined) || req.body.userId;
    if (!isUserScopeAllowed(req, requestedUserId)) {
      return res.status(403).json({
        code: 403,
        message: '无权上传到其他用户账号',
      });
    }

    const userId = resolveRequestUserId(req, requestedUserId || undefined);
    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: 'userId is required',
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请上传文件',
      });
    }

    const originalName = decodeUploadOriginalName(req.file.originalname);
    const report = await reportService.uploadAndAnalyze(
      userId, 
      req.file.path,
      originalName
    );
    const storedReport = await reportService.getReport(report.id);
    const responseData = await attachReportRecommendations(
      {
        reportId: report.id,
        status: report.status,
        anomalyCount: report.anomalyCount,
        indicators: report.indicators,
        aiAnalysis: report.aiAnalysis,
        extractedText: report.extractedText,
      },
      storedReport
    );

    res.json({
      code: 0,
      data: responseData,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '上传失败',
    });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const requestedUserId = req.query.userId as string | undefined;
    if (!isUserScopeAllowed(req, requestedUserId)) {
      return res.status(403).json({
        code: 403,
        message: '无权查看其他用户历史',
      });
    }

    const userId = resolveRequestUserId(req, requestedUserId || undefined);
    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: 'userId is required',
      });
    }
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const reports = await reportService.getReportHistory(userId, page, pageSize);

    res.json({
      code: 0,
      data: {
        list: reports,
        total: reports.length,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      code: 500,
      message: '获取历史失败',
    });
  }
});

router.get('/:reportId', async (req: Request, res: Response) => {
  try {
    const request = req as RequestWithAuth;
    const { reportId } = req.params;
    const report = await reportService.getReport(reportId);

    if (!report) {
      return res.status(404).json({
        code: 404,
        message: '报告不存在',
      });
    }

    if (request.auth?.userId && report.userId !== request.auth.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权查看其他用户报告',
      });
    }

    const responseData = await attachReportRecommendations(report, report);

    res.json({
      code: 0,
      data: responseData,
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      code: 500,
      message: '获取报告失败',
    });
  }
});

router.get('/:reportId/download', async (req: Request, res: Response) => {
  try {
    const request = req as RequestWithAuth;
    const { reportId } = req.params;
    const report = await reportService.getReport(reportId);
    if (!report) {
      return res.status(404).json({
        code: 404,
        message: '报告不存在',
      });
    }

    if (request.auth?.userId && report.userId !== request.auth.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权下载其他用户报告',
      });
    }

    const pdfPath = await reportService.generatePDFReport(reportId);
    
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return res.status(404).json({
        code: 404,
        message: 'PDF报告不存在',
      });
    }

    res.download(pdfPath, `体检报告分析_${reportId}.pdf`);
  } catch (error: any) {
    console.error('Download error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '下载失败',
    });
  }
});

router.post('/analyze/:reportId', async (req: Request, res: Response) => {
  try {
    const request = req as RequestWithAuth;
    const { reportId } = req.params;
    const report = await reportService.getReport(reportId);
    if (!report) {
      return res.status(404).json({
        code: 404,
        message: '报告不存在',
      });
    }

    if (request.auth?.userId && report.userId !== request.auth.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权分析其他用户报告',
      });
    }

    const result = await reportService.reAnalyze(reportId);
    const refreshedReport = await reportService.getReport(reportId);
    const responseData = await attachReportRecommendations(result, refreshedReport);

    res.json({
      code: 0,
      data: responseData,
    });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({
      code: 500,
      message: '分析失败',
    });
  }
});

export { router as reportRouter };
