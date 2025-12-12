import { type CheerioAPI, CheerioCrawler, type LoadedRequest, type Request, log, LogLevel, Sitemap } from 'crawlee';
import { createHash } from 'node:crypto';
import { inspect } from 'util';
import { type DocSearchRecord } from './types.ts';

log.setLevel(LogLevel.INFO);

function generateAlgoliaRecords(request: LoadedRequest<Request>, $: CheerioAPI) {
  const version = $('meta[name="docsearch:version"]').attr('content') || 'current';
  const lang = $('meta[name="docsearch:lang"]').attr('content') || 'en';
  const docusaurus_tag = $('meta[name="docsearch:docusaurus_tag"]').attr('content') || 'default';
  let position = 0;
  const lvl0 =
    $(
      '.menu__link.menu__link--active, menu__link.menu__link--sublist.menu__link--active, .navbar__item.navbar__link--active'
    )
      .last()
      .text() || 'Documentation';

  // Helper function to extract heading hierarchy records
  function extractHeadingLevel(level: number, positionRef: { current: number }) {
    const selector = level === 1 ? 'header h1, article h1' : `article h${level}`;
    let elements = $(selector);

    // Special filter for h3 elements to exclude "Was this page helpful?"
    if (level === 3) {
      elements = elements.filter((_, el) => $(el).text() !== 'Was this page helpful?');
    }

    const records: DocSearchRecord[] = [];

    elements.each((_, el) => {
      // Build hierarchy (same logic as before)
      const hierarchy: DocSearchRecord['hierarchy'] = {
        lvl0,
        lvl1: null,
        lvl2: null,
        lvl3: null,
        lvl4: null,
        lvl5: null,
        lvl6: null,
      };
      if (level === 1) {
        hierarchy.lvl1 = $(el).text();
        for (let i = 2; i <= 6; i++) {
          hierarchy[`lvl${i}`] = null;
        }
      } else {
        hierarchy.lvl1 = $(el).closest('article').find('header h1, > h1').first().text();
        for (let i = 2; i < level; i++) {
          hierarchy[`lvl${i}`] = $(el).prevAll(`h${i}`).first().text() || null;
        }
        hierarchy[`lvl${level}`] = $(el).text();
      }

      // Calculate URL (same as before)
      const prodUrl = new URL(request.url);
      prodUrl.host = 'grafana.com';
      prodUrl.protocol = 'https';
      prodUrl.port = '';

      const anchor = $(el).attr('id') ?? null; // Changed: null instead of ''
      const url = `${prodUrl.toString()}${anchor ? `#${anchor}` : ''}`;

      // Generate objectID
      const objectID = createHash('sha256')
        .update(Object.values(hierarchy).filter(Boolean).join('-') + `-lvl${level}-${positionRef.current}`)
        .digest('hex');

      // Create heading record
      const headingRecord: DocSearchRecord = {
        objectID,
        type: `lvl${level}` as DocSearchRecord['type'],
        hierarchy,
        content: null, // Headings have no content
        url,
        url_without_anchor: prodUrl.toString(),
        anchor,
        weight: {
          ...calculateWeight({ url, type: `lvl${level}` as DocSearchRecord['type'] }),
          position: positionRef.current++,
        },
        version,
        lang,
        language: lang,
        docusaurus_tag,
      };

      records.push(headingRecord);

      // Find content under this heading
      const allBetweenHeadings = $(el).nextUntil(`h1,h2,h3,h4,h5,h6`);
      const contentElements = allBetweenHeadings
        .filter('p, li, td:last-child') // Check the elements themselves
        .add(allBetweenHeadings.find('p, li, td:last-child')) // Check descendants
        .toArray();

      if (contentElements.length > 0) {
        const contentText = contentElements
          .map((el) => $(el).text().trim())
          .filter(Boolean)
          .join(' ');

        if (contentText) {
          const contentObjectID = createHash('sha256')
            .update(Object.values(hierarchy).filter(Boolean).join('-') + `-content-${positionRef.current}`)
            .digest('hex');

          const contentRecord: DocSearchRecord = {
            objectID: contentObjectID,
            type: 'content',
            hierarchy,
            content: contentText,
            url,
            url_without_anchor: prodUrl.toString(),
            anchor,
            weight: {
              ...calculateWeight({ url, type: 'content' }),
              position: positionRef.current++,
            },
            version,
            lang,
            language: lang,
            docusaurus_tag,
          };

          records.push(contentRecord);
        }
      }
    });

    return records;
  }

  const positionRef = { current: position };
  const lvl1 = extractHeadingLevel(1, positionRef);
  const lvl2 = extractHeadingLevel(2, positionRef);
  const lvl3 = extractHeadingLevel(3, positionRef);
  const lvl4 = extractHeadingLevel(4, positionRef);
  const lvl5 = extractHeadingLevel(5, positionRef);
  const lvl6 = extractHeadingLevel(6, positionRef);

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

const levelWeights = {
  lvl0: 100,
  lvl1: 100,
  lvl2: 90,
  lvl3: 80,
  lvl4: 70,
  lvl5: 60,
  lvl6: 50,
  content: 0,
};

const basePath = '/developers/plugin-tools/';

function calculateWeight({ url, type }: { url: string; type: DocSearchRecord['type'] }) {
  const pathname = new URL(url).pathname;
  const pathnameWithoutBasePath = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const depth = pathnameWithoutBasePath.split('/').filter(Boolean).length;
  const pageRank = Math.max(0, 110 - depth * 10);
  return {
    pageRank,
    level: levelWeights[type],
  };
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

await crawler.run(localhostUrls);

// Can pass individual urls for testing purposes.
// const url = ['http://localhost:3000/developers/plugin-tools/how-to-guides/extend-configurations/'];
// await crawler.run(url);

log.info('Crawler finished.');
