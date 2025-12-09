import { type CheerioAPI, CheerioCrawler, type LoadedRequest, type Request, log, LogLevel, Sitemap } from 'crawlee';

import { inspect } from 'util';

log.setLevel(LogLevel.INFO);

function generateAlgoliaRecords(request: LoadedRequest<Request>, $: CheerioAPI) {
  const version = $('meta[name="docsearch:version"]').attr('content') || 'current';
  const lang = $('meta[name="docsearch:lang"]').attr('content') || 'en';
  const docusaurus_tag = $('meta[name="docsearch:docusaurus_tag"]').attr('content') || 'default';

  const lvl0 =
    $(
      '.menu__link.menu__link--active, menu__link.menu__link--sublist.menu__link--active, .navbar__item.navbar__link--active'
    )
      .first()
      .text() || 'Documentation';

  // Helper function to extract heading hierarchy records
  function extractHeadingLevel(level: number) {
    const selector = level === 1 ? 'header h1, article h1' : `article h${level}`;
    let elements = $(selector);

    // Special filter for h3 elements to exclude "Was this page helpful?"
    if (level === 3) {
      elements = elements.filter((_, el) => $(el).text() !== 'Was this page helpful?');
    }

    return elements
      .map((_, el) => {
        const hierarchy: Record<string, string | null> = { lvl0 };
        if (level === 1) {
          hierarchy.lvl1 = $(el).text();
          for (let i = 2; i <= 6; i++) {
            hierarchy[`lvl${i}`] = null;
          }
        } else {
          hierarchy.lvl1 = $(el).closest('article').find('header h1, > h1').first().text();

          // Use previous headings to populate lower hierarchy levels
          for (let i = 2; i < level; i++) {
            hierarchy[`lvl${i}`] = $(el).prevAll(`h${i}`).first().text();
          }

          // Set current level
          hierarchy[`lvl${level}`] = $(el).text();

          // Set remaining levels to null
          for (let i = level + 1; i <= 6; i++) {
            hierarchy[`lvl${i}`] = null;
          }
        }

        const content =
          level === 1
            ? $(el).parent().nextUntil('h1,h2,h3,h4,h5,h6').text() || ''
            : $(el).nextUntil('h1,h2,h3,h4,h5,h6').text() || '';

        const prodUrl = new URL(request.url);
        prodUrl.host = 'grafana.com';
        prodUrl.protocol = 'https';
        prodUrl.port = '';

        const url = `${prodUrl.toString()}${$(el).attr('id') ? `#${$(el).attr('id')}` : ''}`;
        const anchor = $(el).attr('id') ?? '';
        const objectID = generateObjectId(request);

        return {
          objectID: `${objectID}${anchor ? `-${anchor}` : ''}`,
          hierarchy,
          url,
          anchor,
          url_without_anchor: prodUrl.toString(),
          content,
          version,
          lang,
          docusaurus_tag,
        };
      })
      .get();
  }

  const lvl1 = extractHeadingLevel(1);
  const lvl2 = extractHeadingLevel(2);
  const lvl3 = extractHeadingLevel(3);
  const lvl4 = extractHeadingLevel(4);
  const lvl5 = extractHeadingLevel(5);
  const lvl6 = extractHeadingLevel(6);

  const parsedUrl = new URL(request.url);
  const basePath = '/developers/plugin-tools/';
  let pathname = parsedUrl.pathname;

  if (pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length);
  }

  const hierarchy = [...lvl1, ...lvl2, ...lvl3, ...lvl4, ...lvl5, ...lvl6];
  return hierarchy;
}

function generateObjectId(request: LoadedRequest<Request>) {
  const parsedUrl = new URL(request.url);
  const basePath = '/developers/plugin-tools/';
  let pathname = parsedUrl.pathname;

  if (pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length);
  }
  const segments = pathname.split('/').filter(Boolean);
  return segments.length > 0 ? `${segments.join('_')}` : `index`;
}

const crawler = new CheerioCrawler({
  // The crawler downloads and processes the web pages in parallel, with a concurrency
  // automatically managed based on the available system memory and CPU (see AutoscaledPool class).
  // Here we define some hard limits for the concurrency.
  minConcurrency: 10,
  maxConcurrency: 50,
  // On error, retry each page at most once.
  maxRequestRetries: 1,

  // Increase the timeout for processing of each page.
  requestHandlerTimeoutSecs: 30,

  // maxRequestsPerCrawl: 10,

  // This function will be called for each URL to crawl.
  // It accepts a single parameter, which is an object with options as:
  // https://crawlee.dev/js/api/cheerio-crawler/interface/CheerioCrawlerOptions#requestHandler
  // We use for demonstration only 2 of them:
  // - request: an instance of the Request class with information such as the URL that is being crawled and HTTP method
  // - $: the cheerio object containing parsed HTML
  async requestHandler({ pushData, request, $ }) {
    log.info(`Processing ${request.url}...`);
    const result = generateAlgoliaRecords(request, $);
    log.debug(inspect(result, { depth: null, colors: true }));
    const objectID = generateObjectId(request);
    await pushData(result, objectID);
  },

  // This function is called if the page processing failed more than maxRequestRetries + 1 times.
  failedRequestHandler({ request }) {
    log.warning(`Request ${request.url} failed twice.`);
  },
});

const { urls } = await Sitemap.load('http://localhost:3000/developers/plugin-tools/sitemap.xml');
const localhostUrls = urls
  .filter((url: string) => !url.endsWith('/search'))
  .map((url: string) => url.replace(/https:\/\/grafana(-dev)?\.com/, 'http://localhost:3000'));

// Run the crawler and wait for it to finish.
// Can pass individual urls for testing purposes.
// const url = ['http://localhost:3000/developers/plugin-tools/how-to-guides/extend-configurations/'];
await crawler.run(localhostUrls);

log.info('Crawler finished.');
