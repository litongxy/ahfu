const path = require('path');

const servicePath = path.resolve(__dirname, '../dist/services/web-search.service.js');

describe('extractDuckDuckGoResultsFromHtml', () => {
  test('parses result titles, urls and snippets from DuckDuckGo HTML', () => {
    const { extractDuckDuckGoResultsFromHtml } = require(servicePath);
    const html = `
      <div class="result">
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Farticle%3Fid%3D1">
          三七粉与心脑血管研究
        </a>
        <div class="result__snippet">
          有研究提示其可能影响血小板聚集，但不能替代正规治疗。
        </div>
      </div>
    `;

    const results = extractDuckDuckGoResultsFromHtml(html, 3);

    expect(results).toEqual([
      {
        title: '三七粉与心脑血管研究',
        url: 'https://example.com/article?id=1',
        snippet: '有研究提示其可能影响血小板聚集，但不能替代正规治疗。',
      },
    ]);
  });
});
