import { describe, it, expect } from 'vitest';
import type { Page } from '@grafana/plugin-docs-parser';
import {
  DOCS_BASE,
  docPageHref,
  docsLandingPage,
  findDocAncestors,
  findDocPage,
  firstRenderablePage,
  resolveDocHref,
  toDocsNav,
} from './nav.js';

const page = (title: string, slug: string, file: string, extra: Partial<Page> = {}): Page => ({
  title,
  slug,
  file,
  ...extra,
});

const manifestPages = (): Page[] => [
  page('Overview', 'index', 'index.md'),
  page('Guide', 'guide', 'guide.md', {
    headings: [
      { level: 2, text: 'Intro', id: 'intro' },
      { level: 3, text: 'Details', id: 'details' },
      { level: 4, text: 'Too deep', id: 'too-deep' },
    ],
  }),
  // a folder without an index.md is a category node with no file of its own
  page('Options', 'options', '', {
    children: [
      page('Legend', 'options/legend', 'options/legend.md'),
      page('Colors', 'options/colors', 'options/colors.md'),
    ],
  }),
  page('Configuration', 'config', 'config/index.md', {
    children: [page('Settings', 'config/settings', 'config/settings.md')],
  }),
  page('Renamed', 'custom-slug', 'renamed.md'),
];

describe('docPageHref', () => {
  it('maps the index page to the docs root', () => {
    expect(docPageHref('index', DOCS_BASE)).toBe('/docs');
  });

  it('puts every other page under the docs root', () => {
    expect(docPageHref('config/settings', DOCS_BASE)).toBe('/docs/config/settings');
  });

  it('encodes each segment but keeps the separators', () => {
    expect(docPageHref('my page/ünï', DOCS_BASE)).toBe('/docs/my%20page/%C3%BCn%C3%AF');
  });

  it('defaults to DOCS_BASE', () => {
    expect(docPageHref('guide')).toBe('/docs/guide');
  });
});

describe('page lookups', () => {
  it('finds nested pages by slug', () => {
    expect(findDocPage(manifestPages(), 'options/colors')?.title).toBe('Colors');
    expect(findDocPage(manifestPages(), 'nope')).toBeNull();
  });

  it('returns the landing page only when index has a file', () => {
    expect(docsLandingPage(manifestPages())?.file).toBe('index.md');
    expect(docsLandingPage([page('Guide', 'guide', 'guide.md')])).toBeNull();
    expect(docsLandingPage([page('Overview', 'index', '')])).toBeNull();
  });

  it('finds the first page with a file under a category', () => {
    const options = findDocPage(manifestPages(), 'options')!;
    expect(firstRenderablePage(options)?.slug).toBe('options/legend');
    expect(
      firstRenderablePage(page('Empty', 'empty', '', { children: [page('Also empty', 'empty/x', '')] }))
    ).toBeNull();
  });

  it('returns the chain of pages down to a slug', () => {
    expect(findDocAncestors(manifestPages(), 'config/settings').map((p) => p.slug)).toEqual([
      'config',
      'config/settings',
    ]);
    expect(findDocAncestors(manifestPages(), 'guide').map((p) => p.slug)).toEqual(['guide']);
    expect(findDocAncestors(manifestPages(), 'nope')).toEqual([]);
  });
});

describe('toDocsNav', () => {
  it('lists pages in order with hrefs under the docs root', () => {
    const { items } = toDocsNav(manifestPages());
    expect(items.map((item) => [item.label, item.href])).toEqual([
      ['Overview', '/docs'],
      ['Guide', '/docs/guide'],
      ['Options', '/docs/options/legend'],
      ['Configuration', '/docs/config'],
      ['Renamed', '/docs/custom-slug'],
    ]);
  });

  it('points a category at its first page and does not list that page twice', () => {
    const options = toDocsNav(manifestPages()).items.find((item) => item.label === 'Options');
    expect(options?.children?.map((child) => child.label)).toEqual(['Colors']);
  });

  it('keeps all children of a folder that has its own index page', () => {
    const config = toDocsNav(manifestPages()).items.find((item) => item.label === 'Configuration');
    expect(config?.children?.map((child) => child.label)).toEqual(['Settings']);
  });

  it('drops categories with no page anywhere in them', () => {
    const { items } = toDocsNav([page('Overview', 'index', 'index.md'), page('Empty', 'empty', '')]);
    expect(items.map((item) => item.label)).toEqual(['Overview']);
  });

  it('keys h2 and h3 headings by the page href and ignores deeper levels', () => {
    const { headingsByHref } = toDocsNav(manifestPages());
    expect(headingsByHref['/docs/guide']).toEqual([
      { id: 'intro', text: 'Intro', level: 2 },
      { id: 'details', text: 'Details', level: 3 },
    ]);
    expect(headingsByHref['/docs']).toBeUndefined();
  });
});

describe('resolveDocHref', () => {
  const resolve = (href: string, currentFile = 'index.md') =>
    resolveDocHref(href, currentFile, manifestPages(), DOCS_BASE);

  it('resolves sibling links against the current page', () => {
    expect(resolve('./guide')).toBe('/docs/guide');
    expect(resolve('guide')).toBe('/docs/guide');
  });

  it('resolves ../ links from a nested page', () => {
    expect(resolve('../guide', 'config/settings.md')).toBe('/docs/guide');
    expect(resolve('settings', 'config/index.md')).toBe('/docs/config/settings');
  });

  it('uses the page slug, not the file name', () => {
    expect(resolve('./renamed')).toBe('/docs/custom-slug');
  });

  it('maps a folder link to its index page', () => {
    expect(resolve('./config/')).toBe('/docs/config');
    expect(resolve('./')).toBe('/docs');
  });

  it('keeps the query and fragment', () => {
    expect(resolve('./guide?x=1#intro')).toBe('/docs/guide?x=1#intro');
  });

  it('falls back to a path under the docs root for links to unknown pages', () => {
    expect(resolve('./missing')).toBe('/docs/missing');
  });

  it('accepts backslash separators in the current file path', () => {
    expect(resolve('../guide', 'config\\settings.md')).toBe('/docs/guide');
  });

  it('leaves absolute, scheme, protocol-relative and fragment-only links alone', () => {
    for (const href of ['https://grafana.com', 'mailto:a@b.c', '//cdn.example.com/x', '/abs/path', '#intro']) {
      expect(resolve(href)).toBe(href);
    }
  });

  it('refuses encoded dot segments', () => {
    expect(resolve('..%2f..%2fx')).toBe('..%2f..%2fx');
  });
});
