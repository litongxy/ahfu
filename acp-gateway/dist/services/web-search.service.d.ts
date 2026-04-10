export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
}
type WebSearchProvider = 'serper' | 'bing' | 'duckduckgo';
interface WebSearchConfig {
    enabled: boolean;
    provider: WebSearchProvider;
    maxResults: number;
    timeoutMs: number;
    serperApiKey?: string;
    bingApiKey?: string;
}
export declare function extractDuckDuckGoResultsFromHtml(html: string, maxResults: number): WebSearchResult[];
export declare class WebSearchService {
    private readonly config;
    constructor(config?: WebSearchConfig);
    isEnabled(): boolean;
    search(query: string, options?: {
        maxResults?: number;
    }): Promise<WebSearchResult[]>;
    private searchSerper;
    private searchBing;
    private searchDuckDuckGo;
}
export declare const webSearchService: WebSearchService;
export {};
//# sourceMappingURL=web-search.service.d.ts.map