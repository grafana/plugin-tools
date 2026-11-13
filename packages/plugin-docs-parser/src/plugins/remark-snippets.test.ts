import { describe, it, expect } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import { parseMarkdown, readSnippets, type ParseOptions } from '../parser.js';

const snippetValues = { pluginName: 'Acme', pluginId: 'acme-datasource' };

function snippet(name: string, fallback = 'Old text.', closingName = name): string {
  return `<!-- snippet:${name} -->\n\n${fallback}\n\n<!-- /snippet:${closingName} -->`;
}

function render(markdown: string, options: ParseOptions = { snippetValues }): string {
  return toHtml(parseMarkdown(markdown, options).hast);
}

describe('remarkSnippets', () => {
  it('should replace the fallback with the current text', () => {
    const html = render(`Before.\n\n${snippet('use-example-json')}\n\nAfter.`);

    expect(html).not.toContain('Old text.');
    expect(html).toContain('<strong>JSON Model</strong>');
    expect(html).toContain('<p>Before.</p>');
    expect(html).toContain('<p>After.</p>');
  });

  it('should fill in values', () => {
    const html = render(snippet('add-data-source'));

    expect(html).toContain('To add the Acme data source:');
    expect(html).toContain('<code>Acme</code>');
  });

  it('should render a snippet without values when none are given', () => {
    expect(render(snippet('use-example-json'), {})).not.toContain('Old text.');
  });

  it('should keep the fallback for an unknown name', () => {
    expect(render(snippet('no-such-snippet'))).toContain('Old text.');
  });

  it('should keep the fallback when a value is missing', () => {
    expect(render(snippet('add-data-source'), {})).toContain('Old text.');
  });

  it('should not render the markers', () => {
    expect(render(snippet('no-such-snippet'))).not.toContain('snippet:');
  });

  it.each([
    ['unclosed', `<!-- snippet:use-example-json -->\n\nOld text.`],
    ['a stray closing marker', `Old text.\n\n<!-- /snippet:use-example-json -->`],
    ['mismatched', snippet('use-example-json', 'Old text.', 'import-dashboard')],
    [
      'nested',
      `<!-- snippet:import-dashboard -->\n\n${snippet('use-example-json')}\n\n<!-- /snippet:import-dashboard -->`,
    ],
  ])('should keep every fallback on a page with a marker %s', (_case, markdown) => {
    const html = render(`${snippet('reshape-with-transformations', 'Other old text.')}\n\n${markdown}`);

    expect(html).toContain('Old text.');
    expect(html).toContain('Other old text.');
  });

  it.each([
    ['inside a list', '- Item\n\n  <!-- snippet:use-example-json -->'],
    [
      'next to other HTML',
      '<details>\n<summary>More</summary>\n<!-- snippet:use-example-json -->\n\nText.\n\n</details>',
    ],
    ['around a heading', '<!-- snippet:use-example-json -->\n\n## Heading\n\n<!-- /snippet:use-example-json -->'],
  ])('should keep every fallback on a page with a marker %s', (_case, markdown) => {
    const html = render(`${snippet('reshape-with-transformations')}\n\n${markdown}`);

    expect(html).toContain('Old text.');
    expect(html).not.toContain('Transform data');
  });

  it('should swap a marker indented by up to three spaces', () => {
    expect(
      render(' <!-- snippet:use-example-json -->\n\nOld text.\n\n   <!-- /snippet:use-example-json -->')
    ).toContain('<strong>JSON Model</strong>');
  });

  it('should show markdown in a value as written', () => {
    const html = render(snippet('add-data-source'), {
      snippetValues: { pluginName: 'Foo *Pro* `x` [y](https://example.com) <b>', pluginId: 'foo' },
    });

    expect(html).toContain('To add the Foo *Pro* `x` [y](https://example.com) &#x3C;b> data source:');
    expect(html).toContain('<code>Foo *Pro* `x` [y](https://example.com) &#x3C;b></code>');
  });

  it('should ignore markers inside a list', () => {
    const html = render(
      '- Item\n\n  <!-- snippet:use-example-json -->\n\n  Old text.\n\n  <!-- /snippet:use-example-json -->'
    );

    expect(html).toContain('Old text.');
  });

  it('should ignore markers inside a code block', () => {
    const html = render(`\`\`\`markdown\n${snippet('use-example-json')}\n\`\`\``);

    expect(html).toContain('Old text.');
    expect(html).toContain('&#x3C;!-- snippet:use-example-json -->');
  });

  // raw HTML is told apart by source offset, so text whose offsets came from the snippet would be dropped
  it('should keep the text when the page starts with raw HTML', () => {
    const html = render(`<div>${'x'.repeat(400)}</div>\n\n${snippet('use-example-json')}`);

    expect(html).toContain('<strong>JSON Model</strong>');
    expect(html).not.toContain('<div>');
  });

  it('should process links and code blocks in the snippet', () => {
    expect(render(snippet('reshape-with-transformations'))).toContain(
      '<a href="https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/">'
    );
    expect(render(snippet('server-debug-logs'))).toMatch(/<code class="hljs language-ini">/);
  });

  it('should leave the headings unchanged when the fallback has one', () => {
    const markdown = `<!-- snippet:use-example-json -->\n\n## Old heading\n\n<!-- /snippet:use-example-json -->`;

    expect(parseMarkdown(markdown, { snippetValues }).headings).toEqual([
      { text: 'Old heading', level: 2, id: 'old-heading' },
    ]);
  });

  it('should leave the headings unchanged', () => {
    const markdown = `## Import a dashboard\n\n${snippet('import-dashboard')}\n\n## Included dashboards\n\nText.`;

    expect(parseMarkdown(markdown, { snippetValues }).headings).toEqual(parseMarkdown(markdown).headings);
  });
});

describe('readSnippets', () => {
  it('should give line numbers in the whole file', () => {
    const content = `---\ntitle: Page\n---\n\nIntro.\n\n${snippet('use-example-json')}\n`;

    expect(readSnippets(content)).toEqual({
      snippets: [{ name: 'use-example-json', startLine: 7, endLine: 11 }],
      problems: [],
    });
  });

  it('should report each problem with its line', () => {
    const content = [
      '<!-- snippet:use-example-json -->',
      '',
      '## Heading',
      '',
      '<!-- /snippet:import-dashboard -->',
      '',
      '- <!-- snippet:use-example-json -->',
      '',
      '<!-- /snippet:use-example-json -->',
    ].join('\n');

    expect(readSnippets(content).problems).toEqual([
      { kind: 'heading', line: 3, name: 'use-example-json' },
      { kind: 'mismatched', line: 5, name: 'import-dashboard', openName: 'use-example-json' },
      { kind: 'misplaced', line: 7 },
      { kind: 'unopened', line: 9, name: 'use-example-json' },
    ]);
  });

  it('should report a marker that follows other HTML', () => {
    const content = '<details>\n<summary>More</summary>\n<!-- snippet:use-example-json -->\n\n</details>';

    expect(readSnippets(content).problems).toEqual([{ kind: 'misplaced', line: 3 }]);
  });

  it('should ignore markers in code', () => {
    const content = '```markdown\n<!-- snippet:x -->\n```\n\nUse `<!-- snippet:x -->`.';

    expect(readSnippets(content)).toEqual({ snippets: [], problems: [] });
  });
});
