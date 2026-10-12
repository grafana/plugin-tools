import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkStubContent } from './stub-content.js';
import { Rule } from '../types.js';

const input = (docsPath: string, strict = true) => ({ docsPath, strict });

// helper: valid frontmatter markdown file content
const md = (body = '') => `---\ntitle: Page\ndescription: A page\n---\n${body}`;

describe('checkStubContent', () => {
  it('should return empty for nonexistent path', async () => {
    const findings = await checkStubContent(input('/nonexistent/path'));
    expect(findings).toHaveLength(0);
  });

  it('should report a remaining section-brief marker', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      md('## Features\n\n<!-- section-brief:start -->\n\nFill this in.\n\n<!-- section-brief:end -->\n')
    );

    const findings = await checkStubContent(input(tmp));
    const finding = findings.find((f) => f.rule === Rule.UnfilledSectionBrief);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  it('should report as warning in non-strict mode', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), md('<!-- section-brief:start -->\n'));

    const findings = await checkStubContent(input(tmp, false));
    const finding = findings.find((f) => f.rule === Rule.UnfilledSectionBrief);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('warning');
  });

  it('should include the line number of the marker', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), md('\n\n<!-- section-brief:start -->\n'));

    const findings = await checkStubContent(input(tmp));
    const finding = findings.find((f) => f.rule === Rule.UnfilledSectionBrief);
    expect(finding).toBeDefined();
    expect(finding!.line).toBeGreaterThan(1);
  });

  it('should report every remaining marker in a file with multiple sections', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      md(
        '<!-- section-brief:start -->\nFill this in.\n<!-- section-brief:end -->\n\n<!-- section-brief:start -->\nAnd this.\n<!-- section-brief:end -->\n'
      )
    );

    const findings = await checkStubContent(input(tmp));
    expect(findings.filter((f) => f.rule === Rule.UnfilledSectionBrief)).toHaveLength(2);
  });

  it('should not report a page with no section-brief markers', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), md('## Features\n\nThis panel does real things.\n'));

    const findings = await checkStubContent(input(tmp));
    expect(findings.find((f) => f.rule === Rule.UnfilledSectionBrief)).toBeUndefined();
  });

  it('should not report meta files like README.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'README.md'), '# Docs\n\n<!-- section-brief:start -->\n');

    const findings = await checkStubContent(input(tmp));
    expect(findings.find((f) => f.rule === Rule.UnfilledSectionBrief)).toBeUndefined();
  });

  it('should check all markdown files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), md('<!-- section-brief:start -->\n'));
    await writeFile(join(tmp, 'options.md'), md('<!-- section-brief:start -->\n'));

    const findings = await checkStubContent(input(tmp));
    const files = findings.filter((f) => f.rule === Rule.UnfilledSectionBrief).map((f) => f.file);
    expect(files).toContain('index.md');
    expect(files).toContain('options.md');
  });

  it('treats stubs as informational when the author opts in, so a fresh scaffold validates clean', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      md('<!-- section-brief:start -->\n\n> Fill me in\n\n<!-- section-brief:end -->')
    );

    const findings = await checkStubContent({ docsPath: tmp, strict: true, allowUnfilledStubs: true });

    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('info');
  });

  it('still errors for the publishing check, which never opts in', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      md('<!-- section-brief:start -->\n\n> Fill me in\n\n<!-- section-brief:end -->')
    );

    const findings = await checkStubContent({ docsPath: tmp, strict: true });

    expect(findings[0].severity).toBe('error');
  });
});

describe('checkStubContent with comment briefs', () => {
  const brief = (text = 'Describe the options.') => `<!-- section-brief\n${text}\n-->`;

  async function check(body: string, options: { strict?: boolean; allowUnfilledStubs?: boolean } = {}) {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), md(body));
    return checkStubContent({
      docsPath: tmp,
      strict: options.strict ?? true,
      allowUnfilledStubs: options.allowUnfilledStubs,
    });
  }

  it('reports a section that only has its brief as empty, not as a leftover brief', async () => {
    const findings = await check(`## Options\n\n${brief()}\n\n## Next\n\nReal text.\n`);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      rule: Rule.EmptySection,
      severity: 'error',
      line: 5,
      title: 'Unfilled documentation stub',
    });
  });

  it('keeps a multi-line brief with blank lines, tables and lists from counting as content', async () => {
    const findings = await check(
      `## Options\n\n<!-- section-brief\nFill this in.\n\n| A | B |\n| - | - |\n\n- one\n- two\n\n> quote\n-->\n`
    );

    expect(findings.map((f) => f.rule)).toEqual([Rule.EmptySection]);
  });

  it('is a warning in non-strict mode and informational when the author opts in', async () => {
    const body = `## Options\n\n${brief()}\n`;

    expect((await check(body, { strict: false }))[0].severity).toBe('warning');
    expect((await check(body, { allowUnfilledStubs: true }))[0].severity).toBe('info');
  });

  it('warns about a brief left in a section that has content', async () => {
    const findings = await check(`## Options\n\n${brief()}\n\nOne row per option.\n`);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ rule: Rule.UnfilledSectionBrief, severity: 'warning', line: 7 });
  });

  it('keeps the leftover warning when the author opts in, because it is not a stub', async () => {
    const findings = await check(`## Options\n\n${brief()}\n\nOne row per option.\n`, { allowUnfilledStubs: true });

    expect(findings[0].severity).toBe('warning');
  });

  it('reports one finding per empty section in a fresh scaffold', async () => {
    const findings = await check(`${brief()}\n\n## One\n\n${brief()}\n\n## Two\n\n${brief()}\n`);

    expect(findings.map((f) => [f.rule, f.line])).toEqual([
      [Rule.EmptySection, 5],
      [Rule.EmptySection, 9],
      [Rule.EmptySection, 15],
    ]);
  });

  it('reports a brief before the first heading when nothing else is there, but not a bare preamble', async () => {
    expect((await check(`${brief()}\n\n## One\n\nText.\n`)).map((f) => f.line)).toEqual([5]);
    expect(await check('## One\n\nText.\n')).toEqual([]);
  });

  it('reports a heading with no brief and no content', async () => {
    const findings = await check('## One\n\n## Two\n\nText.\n\n## Three\n');

    expect(findings.map((f) => [f.line, f.title])).toEqual([
      [5, 'Empty section'],
      [11, 'Empty section'],
    ]);
  });

  it('does not report a heading that is followed directly by a deeper one', async () => {
    expect(await check('## Options\n\n### Panel\n\nText.\n\n### Tooltip\n\nText.\n')).toEqual([]);
  });

  it('reports a heading followed by a heading of the same or a higher level', async () => {
    expect((await check('### One\n\n## Two\n\nText.\n')).map((f) => f.line)).toEqual([5]);
  });

  it('counts images, tables, code and inline text next to a comment as content', async () => {
    const body = [
      '## Image\n\n![Alt](img/a.png)\n',
      '## Table\n\n| A |\n| - |\n| 1 |\n',
      '## Code\n\n```bash\nnpm run x\n```\n',
      '## Inline\n\n<!-- note --> Some text\n',
    ].join('\n');

    expect(await check(body)).toEqual([]);
  });

  it('does not read a heading or a brief inside a fenced code block', async () => {
    const body =
      '## Example\n\n```markdown\n## Not a heading\n\n<!-- section-brief\nFill me\n-->\n```\n\n## After\n\nText.\n';

    expect(await check(body)).toEqual([]);
  });

  it('does not read comment-looking text in frontmatter as a heading', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Page\n# a yaml comment\n---\n\n## One\n\nText.\n');

    expect(await checkStubContent({ docsPath: tmp, strict: true })).toEqual([]);
  });

  it('reports a section whose only content is an unrelated comment', async () => {
    expect((await check('## One\n\n<!-- TODO -->\n')).map((f) => f.rule)).toEqual([Rule.EmptySection]);
  });

  it('keeps the legacy markers a stub even though the text between them renders', async () => {
    const findings = await check(
      '## Options\n\n<!-- section-brief:start -->\n\n> Fill this in\n\n<!-- section-brief:end -->\n'
    );

    expect(findings.map((f) => f.rule)).toEqual([Rule.UnfilledSectionBrief]);
    expect(findings[0].severity).toBe('error');
  });
});
