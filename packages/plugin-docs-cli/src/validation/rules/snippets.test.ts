import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { renderSnippet } from '@grafana/plugin-docs-parser';
import { checkSnippets, getSnippetLines } from './snippets.js';
import { Rule, type ValidationInput } from '../types.js';

const snippetValues = { pluginName: 'Acme', pluginId: 'acme-datasource' };

const md = (body: string) => `---\ntitle: Page\ndescription: A page\n---\n\n${body}\n`;

function snippet(name: string, text = renderSnippet(name, snippetValues) ?? 'Old text.', closingName = name): string {
  return `<!-- snippet:${name} -->\n\n${text}\n\n<!-- /snippet:${closingName} -->`;
}

async function check(body: string, input: Partial<ValidationInput> = { snippetValues }) {
  const tmp = await mkdtemp(join(tmpdir(), 'snippets-test-'));
  await writeFile(join(tmp, 'index.md'), md(body));
  return checkSnippets({ docsPath: tmp, ...input });
}

describe('checkSnippets', () => {
  it('should return empty for nonexistent path', async () => {
    expect(await checkSnippets({ docsPath: '/nonexistent/path' })).toHaveLength(0);
  });

  it('should accept a current snippet', async () => {
    expect(await check(`Intro.\n\n${snippet('add-data-source')}\n\nMore.`)).toHaveLength(0);
  });

  it('should accept a current snippet with different line wrapping', async () => {
    const text = renderSnippet('reshape-with-transformations')!.replace('. ', '.\n');
    expect(await check(snippet('reshape-with-transformations', text))).toHaveLength(0);
  });

  it('should report an unknown snippet', async () => {
    const findings = await check(snippet('import-dashbaord', 'Text.'));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ rule: Rule.KnownSnippet, severity: 'warning', line: 6 });
  });

  it('should report edited snippet text as info', async () => {
    const findings = await check(snippet('add-data-source', 'To add the data source, click **Connections**.'));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ rule: Rule.SnippetTextCurrent, severity: 'info', line: 6 });
  });

  it('should not compare the text without the values it needs', async () => {
    expect(await check(snippet('add-data-source', 'Old text.'), {})).toHaveLength(0);
  });

  it.each([
    ['unclosed', '<!-- snippet:use-example-json -->\n\nText.', 'Unclosed snippet'],
    [
      'closed without being opened',
      'Text.\n\n<!-- /snippet:use-example-json -->',
      'Snippet closed without being opened',
    ],
    [
      'closed with the wrong name',
      snippet('use-example-json', undefined, 'import-dashboard'),
      'Snippet closed with the wrong name',
    ],
    [
      'nested',
      `<!-- snippet:import-dashboard -->\n\n${snippet('use-example-json')}\n\n<!-- /snippet:import-dashboard -->`,
      'Nested snippet',
    ],
    ['indented', '- Item\n\n  <!-- snippet:use-example-json -->', 'Snippet marker not on its own line'],
    ['in a quote', '> <!-- snippet:use-example-json -->', 'Snippet marker not on its own line'],
    ['after text', 'Text <!-- snippet:use-example-json -->', 'Snippet marker not on its own line'],
    [
      'around a heading',
      '<!-- snippet:use-example-json -->\n\n## Heading\n\n<!-- /snippet:use-example-json -->',
      'Heading inside a snippet',
    ],
  ])('should report a marker %s', async (_case, body, title) => {
    const findings = await check(body);
    const finding = findings.find((f) => f.rule === Rule.ValidSnippetBlock);

    expect(finding).toMatchObject({ severity: 'warning', title });
  });

  it('should report a marker that follows other HTML', async () => {
    const findings = await check(
      `<details>\n<summary>More</summary>\n<!-- snippet:use-example-json -->\n\nText.\n\n</details>\n\n<!-- /snippet:use-example-json -->`
    );

    expect(findings.map((f) => f.title)).toEqual([
      'Snippet marker not on its own line',
      'Snippet closed without being opened',
    ]);
  });

  it('should accept a marker indented by up to three spaces', async () => {
    expect(await check(snippet('use-example-json').replace('<!--', ' <!--'))).toHaveLength(0);
  });

  it('should ignore markers in code', async () => {
    const body = `\`\`\`markdown\n<!-- snippet:no-such-snippet -->\n\`\`\`\n\nUse \`<!-- snippet:no-such-snippet -->\` to open it.`;
    expect(await check(body)).toHaveLength(0);
  });

  it('should skip repo-meta files such as README.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'snippets-test-'));
    await writeFile(join(tmp, 'README.md'), '<!-- snippet:no-such-snippet -->\n');

    expect(await checkSnippets({ docsPath: tmp })).toHaveLength(0);
  });
});

describe('getSnippetLines', () => {
  it('should return the lines from each opening marker to its closing marker', () => {
    const content = `Intro.\n\n${snippet('use-example-json', 'Text.')}\n\nMore.`;
    expect([...getSnippetLines(content)]).toEqual([3, 4, 5, 6, 7]);
  });

  it('should return no lines for an unclosed snippet', () => {
    expect(getSnippetLines('<!-- snippet:use-example-json -->\n\nText.').size).toBe(0);
  });
});
