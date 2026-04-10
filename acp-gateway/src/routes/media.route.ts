import express, { Request, Response } from 'express';
import https from 'https';
import http from 'http';

export const mediaRouter = express.Router();

function isAllowedPosterUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      (/\.hdslb\.com$/i.test(parsed.hostname) ||
        /\.biliimg\.com$/i.test(parsed.hostname) ||
        /\.bilivideo\.com$/i.test(parsed.hostname))
    );
  } catch {
    return false;
  }
}

function normalizePosterUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }
  return trimmed;
}

function requestBuffer(url: string, headers: Record<string, string>, redirectCount: number = 0): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.request(url, { method: 'GET', headers }, (resp) => {
      const statusCode = resp.statusCode || 500;
      const location = resp.headers.location;
      if (statusCode >= 300 && statusCode < 400 && location && redirectCount < 3) {
        const nextUrl = new URL(location, url).toString();
        resp.resume();
        requestBuffer(nextUrl, headers, redirectCount + 1).then(resolve).catch(reject);
        return;
      }

      const chunks: Buffer[] = [];
      resp.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      resp.on('end', () => {
        resolve({
          statusCode,
          headers: resp.headers,
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function requestJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const resp = await requestBuffer(url, headers);
  const text = resp.body.toString('utf-8');
  return JSON.parse(text) as T;
}

mediaRouter.get('/bili-cover', async (req: Request, res: Response) => {
  const src = req.query.src;
  const bvid = req.query.bvid;
  const srcUrl = typeof src === 'string' ? normalizePosterUrl(src) : '';
  const bvidValue = typeof bvid === 'string' ? bvid.trim() : '';

  if (!srcUrl && !bvidValue) {
    res.status(400).json({
      error: {
        code: 'INVALID_IMAGE_URL',
        message: 'Either src or bvid is required',
      },
    });
    return;
  }

  try {
    let finalImageUrl = srcUrl;

    if (!finalImageUrl && bvidValue) {
      const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvidValue)}`;
      const viewData = await requestJson<{
        code?: number;
        data?: { pic?: string };
      }>(viewUrl, {
        Referer: 'https://www.bilibili.com/',
        'User-Agent': 'Mozilla/5.0',
      });
      const pic = typeof viewData?.data?.pic === 'string' ? viewData.data.pic.trim() : '';
      if (!pic) {
        res.status(404).json({
          error: {
            code: 'BILI_COVER_NOT_FOUND',
            message: 'Cover not found for this bvid',
          },
        });
        return;
      }
      finalImageUrl = normalizePosterUrl(pic);
    }

    if (!isAllowedPosterUrl(finalImageUrl)) {
      res.status(400).json({
        error: {
          code: 'INVALID_IMAGE_URL',
          message: 'Invalid or unsupported image source',
        },
      });
      return;
    }

    const upstream = await requestBuffer(finalImageUrl, {
      Referer: 'https://www.bilibili.com/',
      'User-Agent': 'Mozilla/5.0',
    });

    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
      res.status(upstream.statusCode).json({
        error: {
          code: 'UPSTREAM_IMAGE_ERROR',
          message: `Failed to fetch image: ${upstream.statusCode}`,
        },
      });
      return;
    }

    const contentType = Array.isArray(upstream.headers['content-type'])
      ? upstream.headers['content-type'][0]
      : (upstream.headers['content-type'] || 'image/jpeg');
    const cacheControl = Array.isArray(upstream.headers['cache-control'])
      ? upstream.headers['cache-control'][0]
      : (upstream.headers['cache-control'] || 'public, max-age=86400');
    const imageBuffer = upstream.body;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', cacheControl);
    res.setHeader('Content-Length', String(imageBuffer.length));
    res.send(imageBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({
      error: {
        code: 'IMAGE_PROXY_ERROR',
        message,
      },
    });
  }
});
