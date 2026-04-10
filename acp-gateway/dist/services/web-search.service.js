"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSearchService = exports.WebSearchService = void 0;
exports.extractDuckDuckGoResultsFromHtml = extractDuckDuckGoResultsFromHtml;
const https_1 = __importDefault(require("https"));
function parseBooleanEnv(value) {
    if (value === undefined)
        return undefined;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized))
        return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized))
        return false;
    return undefined;
}
function clampInt(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function normalizeProvider(value) {
    const normalized = (value || '').trim().toLowerCase();
    if (normalized === 'serper' || normalized === 'bing' || normalized === 'duckduckgo') {
        return normalized;
    }
    return undefined;
}
function readConfigFromEnv() {
    const serperApiKey = process.env.SERPER_API_KEY || process.env.WEB_SEARCH_API_KEY;
    const bingApiKey = process.env.BING_SEARCH_API_KEY || process.env.BING_API_KEY || process.env.WEB_SEARCH_API_KEY;
    const providerFromEnv = normalizeProvider(process.env.WEB_SEARCH_PROVIDER);
    const provider = providerFromEnv || (serperApiKey ? 'serper' : bingApiKey ? 'bing' : 'duckduckgo');
    const maxResults = clampInt(parseInt(process.env.WEB_SEARCH_MAX_RESULTS || '5', 10) || 5, 1, 10);
    const timeoutMs = clampInt(parseInt(process.env.WEB_SEARCH_TIMEOUT_MS || '8000', 10) || 8000, 1000, 30000);
    const enabledFromEnv = parseBooleanEnv(process.env.WEB_SEARCH_ENABLED);
    const enabled = enabledFromEnv ?? true;
    return {
        enabled,
        provider,
        maxResults,
        timeoutMs,
        serperApiKey,
        bingApiKey,
    };
}
async function requestText(url, options) {
    return new Promise((resolve, reject) => {
        const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
        const headers = {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding': 'identity',
            'User-Agent': 'Mozilla/5.0 (compatible; TongRenTangHealthBot/1.0)',
            ...(payload ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {}),
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload, 'utf8').toString() } : {}),
        };
        const req = https_1.default.request(url, {
            method: options.method,
            headers,
        }, (res) => {
            const statusCode = res.statusCode || 0;
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (statusCode < 200 || statusCode >= 300) {
                    reject(new Error(`Web search HTTP ${statusCode}: ${data.slice(0, 300)}`));
                    return;
                }
                resolve(data);
            });
        });
        req.setTimeout(options.timeoutMs, () => {
            req.destroy(new Error('Web search request timeout'));
        });
        req.on('error', reject);
        if (payload)
            req.write(payload);
        req.end();
    });
}
async function requestJson(url, options) {
    return new Promise((resolve, reject) => {
        const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
        const headers = {
            Accept: 'application/json',
            ...(payload ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {}),
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload, 'utf8').toString() } : {}),
        };
        const req = https_1.default.request(url, {
            method: options.method,
            headers,
        }, (res) => {
            const statusCode = res.statusCode || 0;
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (statusCode < 200 || statusCode >= 300) {
                    reject(new Error(`Web search HTTP ${statusCode}: ${data.slice(0, 300)}`));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                }
                catch (err) {
                    reject(new Error(`Web search JSON parse failed: ${String(err)}`));
                }
            });
        });
        req.setTimeout(options.timeoutMs, () => {
            req.destroy(new Error('Web search request timeout'));
        });
        req.on('error', reject);
        if (payload)
            req.write(payload);
        req.end();
    });
}
function stripHtmlTags(value) {
    return value
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function decodeHtmlEntities(value) {
    const namedEntities = {
        amp: '&',
        lt: '<',
        gt: '>',
        quot: '"',
        apos: "'",
        nbsp: ' ',
        mdash: '-',
        ndash: '-',
        hellip: '...',
    };
    return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
        const normalized = String(entity).toLowerCase();
        if (normalized.startsWith('#x')) {
            const codePoint = parseInt(normalized.slice(2), 16);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }
        if (normalized.startsWith('#')) {
            const codePoint = parseInt(normalized.slice(1), 10);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }
        return namedEntities[normalized] ?? match;
    });
}
function resolveDuckDuckGoUrl(rawUrl) {
    const trimmed = decodeHtmlEntities(rawUrl.trim());
    if (!trimmed)
        return '';
    try {
        const resolved = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed, 'https://duckduckgo.com');
        const redirectTarget = resolved.searchParams.get('uddg');
        return redirectTarget ? decodeURIComponent(redirectTarget) : resolved.toString();
    }
    catch {
        return trimmed;
    }
}
function extractDuckDuckGoResultsFromHtml(html, maxResults) {
    const results = [];
    const seen = new Set();
    const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = anchorPattern.exec(html)) && results.length < maxResults) {
        const attributes = match[1] || '';
        if (!/\bclass="[^"]*\bresult__a\b[^"]*"/i.test(attributes))
            continue;
        const hrefMatch = attributes.match(/\bhref="([^"]+)"/i);
        const url = resolveDuckDuckGoUrl(hrefMatch?.[1] || '');
        if (!url || seen.has(url))
            continue;
        const title = decodeHtmlEntities(stripHtmlTags(match[2] || ''));
        if (!title)
            continue;
        const trailingHtml = html.slice(match.index, Math.min(html.length, anchorPattern.lastIndex + 1600));
        const snippetMatch = trailingHtml.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) ||
            trailingHtml.match(/<div[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
        const snippet = decodeHtmlEntities(stripHtmlTags(snippetMatch?.[1] || ''));
        seen.add(url);
        results.push({ title, url, snippet });
    }
    return results;
}
class WebSearchService {
    constructor(config = readConfigFromEnv()) {
        this.config = config;
    }
    isEnabled() {
        return this.config.enabled;
    }
    async search(query, options) {
        if (!this.isEnabled())
            return [];
        const trimmed = query.trim();
        if (!trimmed)
            return [];
        const maxResults = clampInt(options?.maxResults ?? this.config.maxResults, 1, 10);
        try {
            if (this.config.provider === 'serper' && this.config.serperApiKey) {
                return await this.searchSerper(trimmed, maxResults);
            }
            if (this.config.provider === 'bing' && this.config.bingApiKey) {
                return await this.searchBing(trimmed, maxResults);
            }
            return await this.searchDuckDuckGo(trimmed, maxResults);
        }
        catch (err) {
            console.warn('Web search failed:', err);
            return [];
        }
    }
    async searchSerper(query, maxResults) {
        const apiKey = this.config.serperApiKey;
        if (!apiKey)
            return [];
        const url = new URL('https://google.serper.dev/search');
        const body = {
            q: query,
            num: maxResults,
            hl: process.env.WEB_SEARCH_HL || 'zh-cn',
            gl: process.env.WEB_SEARCH_GL || 'cn',
        };
        const json = await requestJson(url, {
            method: 'POST',
            headers: { 'X-API-KEY': apiKey },
            body,
            timeoutMs: this.config.timeoutMs,
        });
        const organic = json.organic || [];
        return organic
            .map((item) => ({
            title: item.title || '',
            url: item.link || '',
            snippet: item.snippet || '',
        }))
            .filter((item) => item.title && item.url)
            .slice(0, maxResults);
    }
    async searchBing(query, maxResults) {
        const apiKey = this.config.bingApiKey;
        if (!apiKey)
            return [];
        const url = new URL('https://api.bing.microsoft.com/v7.0/search');
        url.searchParams.set('q', query);
        url.searchParams.set('mkt', process.env.WEB_SEARCH_MKT || 'zh-CN');
        url.searchParams.set('count', String(maxResults));
        url.searchParams.set('responseFilter', 'Webpages');
        url.searchParams.set('textDecorations', 'false');
        url.searchParams.set('textFormat', 'Raw');
        const json = await requestJson(url, {
            method: 'GET',
            headers: { 'Ocp-Apim-Subscription-Key': apiKey },
            timeoutMs: this.config.timeoutMs,
        });
        const values = json.webPages?.value || [];
        return values
            .map((item) => ({
            title: item.name || '',
            url: item.url || '',
            snippet: item.snippet || '',
        }))
            .filter((item) => item.title && item.url)
            .slice(0, maxResults);
    }
    async searchDuckDuckGo(query, maxResults) {
        const url = new URL('https://html.duckduckgo.com/html/');
        url.searchParams.set('q', query);
        url.searchParams.set('kl', process.env.WEB_SEARCH_DDG_REGION || 'cn-zh');
        const html = await requestText(url, {
            method: 'GET',
            timeoutMs: this.config.timeoutMs,
        });
        return extractDuckDuckGoResultsFromHtml(html, maxResults).slice(0, maxResults);
    }
}
exports.WebSearchService = WebSearchService;
exports.webSearchService = new WebSearchService();
//# sourceMappingURL=web-search.service.js.map