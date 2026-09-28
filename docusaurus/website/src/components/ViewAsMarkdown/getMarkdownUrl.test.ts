import { describe, expect, it } from 'vitest';
import { getMarkdownUrl } from './getMarkdownUrl';

const baseUrl = '/developers/plugin-tools/';

describe('getMarkdownUrl', () => {
  it('maps the site root to index.md', () => {
    expect(getMarkdownUrl(baseUrl, baseUrl)).toBe('/developers/plugin-tools/index.md');
  });

  it('appends .md to a doc permalink', () => {
    expect(getMarkdownUrl('/developers/plugin-tools/how-to-guides/data-source-plugins/add-router', baseUrl)).toBe(
      '/developers/plugin-tools/how-to-guides/data-source-plugins/add-router.md'
    );
  });

  it('drops a trailing slash before appending .md', () => {
    expect(getMarkdownUrl('/developers/plugin-tools/how-to-guides/', baseUrl)).toBe(
      '/developers/plugin-tools/how-to-guides.md'
    );
  });
});
