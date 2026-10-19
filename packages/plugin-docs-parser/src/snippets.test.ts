import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { SNIPPET_NAMES, getSnippetSource, parseSnippetMarker, renderSnippet } from './snippets.js';

const values = { pluginName: 'Acme', pluginId: 'acme-datasource' };

describe('SNIPPET_NAMES', () => {
  it.each(SNIPPET_NAMES)('%s is kebab-case', (name) => {
    expect(name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});

describe.each(SNIPPET_NAMES)('snippet %s', (name) => {
  const markdown = renderSnippet(name, values);
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown ?? '');

  it('uses only known placeholders', () => {
    expect(markdown).toBeDefined();
    expect(markdown).not.toMatch(/\{\{|\}\}/);
  });

  // the manifest's table of contents is built from the page, so a heading here would be missing from it
  it('has no headings', () => {
    visit(tree, 'heading', () => {
      throw new Error('snippet has a heading');
    });
  });

  it('has no raw HTML or comments', () => {
    visit(tree, 'html', () => {
      throw new Error('snippet has raw HTML');
    });
  });

  // a relative link would point at a page the plugin might not have
  it('has only absolute links', () => {
    visit(tree, ['link', 'definition'], (node) => {
      if ('url' in node) {
        expect(node.url).toMatch(/^https:\/\//);
      }
    });
  });

  // the parser fills in values only in text and code, not in link targets
  it('has no placeholders in links', () => {
    const source = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .parse(getSnippetSource(name) ?? '');
    visit(source, (node) => {
      if ('url' in node) {
        expect(node.url).not.toContain('{{');
      }
    });
  });
});

describe('parseSnippetMarker', () => {
  it.each([
    ['<!-- snippet:import-dashboard -->', { name: 'import-dashboard', isClosing: false }],
    ['<!-- /snippet:import-dashboard -->', { name: 'import-dashboard', isClosing: true }],
    ['  <!--snippet:import-dashboard-->  ', { name: 'import-dashboard', isClosing: false }],
  ])('reads %s', (text, expected) => {
    expect(parseSnippetMarker(text)).toEqual(expected);
  });

  it.each([
    '<!-- section-brief -->',
    '<!-- snippet: -->',
    'Text <!-- snippet:import-dashboard -->',
    '<!-- snippet:import-dashboard --> text',
  ])('ignores %s', (text) => {
    expect(parseSnippetMarker(text)).toBeUndefined();
  });
});

describe('renderSnippet', () => {
  it('fills in the values', () => {
    expect(renderSnippet('add-data-source', values)).toContain('To add the Acme data source:');
  });

  it('returns undefined for an unknown name', () => {
    expect(renderSnippet('no-such-snippet', values)).toBeUndefined();
    expect(renderSnippet('toString', values)).toBeUndefined();
  });

  it('returns undefined when a value is missing', () => {
    expect(renderSnippet('add-data-source')).toBeUndefined();
    expect(renderSnippet('add-data-source', { ...values, pluginName: '' })).toBeUndefined();
  });

  it('renders a snippet without values when none are given', () => {
    expect(renderSnippet('use-example-json')).toContain('**JSON Model**');
  });
});
