import { describe, expect, it } from 'vitest';
import {
  decodeRefPath,
  escapesDocsRoot,
  formatBytes,
  getCodeBlockLines,
  getNonProseLines,
  getReferenceDefinitions,
  isMetaFile,
  maskInlineCode,
  maskLinkTargets,
  matchOutsideCode,
} from './utils.js';

describe('isMetaFile', () => {
  it('matches README.md regardless of case', () => {
    expect(isMetaFile('README.md')).toBe(true);
    expect(isMetaFile('readme.md')).toBe(true);
    expect(isMetaFile('Readme.md')).toBe(true);
  });

  it('matches other common repo-meta files', () => {
    expect(isMetaFile('CONTRIBUTING.md')).toBe(true);
    expect(isMetaFile('LICENSE.md')).toBe(true);
    expect(isMetaFile('CODE_OF_CONDUCT.md')).toBe(true);
    expect(isMetaFile('SECURITY.md')).toBe(true);
    expect(isMetaFile('CHANGELOG.md')).toBe(true);
    expect(isMetaFile('AGENTS.md')).toBe(true);
  });

  it('matches when given a path, not just a basename', () => {
    expect(isMetaFile('docs/README.md')).toBe(true);
    expect(isMetaFile('/abs/path/to/docs/README.md')).toBe(true);
    expect(isMetaFile('docs\\README.md')).toBe(true);
  });

  it('does not match regular doc pages', () => {
    expect(isMetaFile('index.md')).toBe(false);
    expect(isMetaFile('query-editor.md')).toBe(false);
    expect(isMetaFile('configuration.md')).toBe(false);
    expect(isMetaFile('docs/index.md')).toBe(false);
  });

  it('does not match non-md files', () => {
    expect(isMetaFile('README.txt')).toBe(false);
    expect(isMetaFile('readme')).toBe(false);
  });

  it('does not match files that merely contain a meta basename in their path component', () => {
    expect(isMetaFile('readme-tips.md')).toBe(false);
    expect(isMetaFile('contributing-quickstart.md')).toBe(false);
    expect(isMetaFile('agents-of-shield.md')).toBe(false);
  });
});

describe('formatBytes', () => {
  it('formats sub-kilobyte counts as bytes', () => {
    expect(formatBytes(0)).toBe('0B');
    expect(formatBytes(512)).toBe('512B');
  });

  it('formats kilobyte counts, rounded', () => {
    expect(formatBytes(1024)).toBe('1KB');
    expect(formatBytes(1536)).toBe('2KB');
  });

  it('formats megabyte counts to one decimal place', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0MB');
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5MB');
  });
});

describe('maskInlineCode', () => {
  it('masks the contents of a single-backtick span, preserving the delimiters', () => {
    expect(maskInlineCode('a `<div>` b')).toBe('a `#####` b');
  });

  it('preserves line length and removes tag-like text from masked spans', () => {
    const line = 'text `<slug>` more `<page>` end';
    const masked = maskInlineCode(line);
    expect(masked).toHaveLength(line.length);
    expect(masked).not.toContain('<slug>');
    expect(masked).not.toContain('<page>');
  });

  it('returns a line with no backticks unchanged', () => {
    expect(maskInlineCode('no backticks here')).toBe('no backticks here');
  });

  it('leaves an unterminated backtick run unmasked', () => {
    expect(maskInlineCode('`unterminated <div>')).toBe('`unterminated <div>');
  });

  it('masks multiple independent spans on one line', () => {
    expect(maskInlineCode('`<a>` and `<b>`')).toBe('`###` and `###`');
  });

  it('masks a double-backtick span containing a literal single backtick', () => {
    const line = '``<a> ` <b>``';
    const masked = maskInlineCode(line);
    expect(masked.startsWith('``')).toBe(true);
    expect(masked.endsWith('``')).toBe(true);
    expect(masked).not.toContain('<a>');
    expect(masked).not.toContain('<b>');
    expect(masked).toHaveLength(line.length);
  });
});

describe('maskLinkTargets', () => {
  it('should mask a link target but keep the visible text', () => {
    const masked = maskLinkTargets('Read the [setup guide](./configure-datasource.md) first.');
    expect(masked).toContain('[setup guide]');
    expect(masked).not.toContain('datasource');
  });

  it('should mask an autolink', () => {
    expect(maskLinkTargets('See <https://example.com/datasource> for more.')).not.toContain('datasource');
  });

  it('should preserve length, since callers index the raw line with offsets from the masked one', () => {
    const line = 'An ![image](./a.png) and a [link](./b.md) on one line.';
    expect(maskLinkTargets(line)).toHaveLength(line.length);
  });

  it('should leave a line with no links untouched', () => {
    const line = 'Plain prose with no links at all.';
    expect(maskLinkTargets(line)).toBe(line);
  });

  it('should mask a bare URL written as plain text', () => {
    const masked = maskLinkTargets('See https://github.com/grafana/my-datasource for more.');
    expect(masked).not.toContain('github');
    expect(masked).not.toContain('datasource');
    expect(masked).toContain('See ');
    expect(masked).toContain(' for more.');
  });

  it('should mask the target of a link reference definition', () => {
    const masked = maskLinkTargets('[guide]: ./configure-datasource.md');
    expect(masked).toContain('[guide]:');
    expect(masked).not.toContain('datasource');
  });

  it('should preserve length for every link form', () => {
    for (const line of [
      'See https://github.com/org/repo now.',
      '[ref]: ./some-datasource.md',
      'An ![i](./a.png) and <https://e.com/x> and [l](./b.md).',
    ]) {
      expect(maskLinkTargets(line)).toHaveLength(line.length);
    }
  });
});

describe('getNonProseLines', () => {
  it('should mark the frontmatter block', () => {
    const lines = getNonProseLines('---\ntitle: A\n---\n\nBody text.\n');
    expect(lines.has(1)).toBe(true);
    expect(lines.has(2)).toBe(true);
    expect(lines.has(3)).toBe(true);
    expect(lines.has(5)).toBe(false);
  });

  it('should not treat a mid-document thematic break as frontmatter', () => {
    const lines = getNonProseLines('Body text.\n\n---\n\nMore body text.\n');
    expect(lines.has(1)).toBe(false);
    expect(lines.has(5)).toBe(false);
  });

  it('should mark a multi-line HTML comment', () => {
    const lines = getNonProseLines('Before.\n<!-- a\nb -->\nAfter.\n');
    expect(lines.has(2)).toBe(true);
    expect(lines.has(3)).toBe(true);
    expect(lines.has(4)).toBe(false);
  });

  it('should mark the whole section-brief span, including the prose between the markers', () => {
    const content = [
      'Before.',
      '<!-- section-brief:start -->',
      '',
      '> Fill this in.',
      '',
      '<!-- section-brief:end -->',
      'After.',
    ].join('\n');
    const lines = getNonProseLines(content);
    expect(lines.has(1)).toBe(false);
    expect(lines.has(4)).toBe(true);
    expect(lines.has(6)).toBe(true);
    expect(lines.has(7)).toBe(false);
  });

  it('should mark an indented code block but not a list continuation', () => {
    expect(getNonProseLines('Text.\n\n    const a = 1;\n').has(3)).toBe(true);
    expect(getNonProseLines('Text.\n\n    - a nested list item\n').has(3)).toBe(false);
  });
});

describe('getReferenceDefinitions', () => {
  it('should return link definitions with their line', () => {
    const content = 'See [Explore][docs].\n\n[docs]: https://grafana.com/docs/explore/ "Explore"\n';

    expect(getReferenceDefinitions(content, new Set())).toEqual([
      { label: 'docs', ref: 'https://grafana.com/docs/explore/', line: 3, isImage: false },
    ]);
  });

  it('should mark a definition used by an image as an image, matching labels case-insensitively', () => {
    const content =
      '![Query builder][Builder Shot]\n![shot]\n\n[builder   shot]: img/builder.png\n[shot]: img/shot.png\n';

    expect(getReferenceDefinitions(content, new Set())).toEqual([
      { label: 'builder shot', ref: 'img/builder.png', line: 4, isImage: true },
      { label: 'shot', ref: 'img/shot.png', line: 5, isImage: true },
    ]);
  });

  it('should read an angle-bracket destination', () => {
    expect(getReferenceDefinitions('[a]: <./page with space.md>\n', new Set())[0].ref).toBe('./page with space.md');
  });

  it('should skip footnote definitions and skipped lines', () => {
    const content = '[^1]: A footnote.\n```\n[docs]: https://example.com\n```\n';

    expect(getReferenceDefinitions(content, getCodeBlockLines(content))).toEqual([]);
  });
});

describe('matchOutsideCode', () => {
  const content = ['Alpha here.', '```', 'Alpha in code.', '```', 'Alpha again.'].join('\n');

  it('should skip fenced code blocks', () => {
    const hits = matchOutsideCode(content, /Alpha/g, getCodeBlockLines(content));
    expect(hits.map((h) => h.line)).toEqual([1, 5]);
  });

  it('should honour an extra skipLines set', () => {
    const hits = matchOutsideCode(content, /Alpha/g, getCodeBlockLines(content), { skipLines: new Set([1]) });
    expect(hits.map((h) => h.line)).toEqual([5]);
  });

  it('should optionally mask inline code and link targets', () => {
    const line = 'Use `Alpha` and [text](./Alpha.md) and Alpha.';
    const hits = matchOutsideCode(line, /Alpha/g, new Set(), { maskInlineCode: true, maskLinkTargets: true });
    expect(hits).toHaveLength(1);
  });

  it('should not loop forever on a zero-length match', () => {
    expect(matchOutsideCode('abc', /x*/g, new Set()).length).toBeGreaterThan(0);
  });
});

describe('decodeRefPath', () => {
  it('drops the query and fragment', () => {
    expect(decodeRefPath('page.md?x=1#top')).toBe('page.md');
  });

  it('decodes percent escapes', () => {
    expect(decodeRefPath('..%2fimg/my%20pic.png')).toBe('../img/my pic.png');
  });

  it('keeps decoding after a malformed escape', () => {
    expect(decodeRefPath('a%ZZ/%2e%2e/x.png')).toBe('a%ZZ/../x.png');
  });

  it('leaves a plain path unchanged', () => {
    expect(decodeRefPath('./img/x.png')).toBe('./img/x.png');
  });
});

describe('escapesDocsRoot', () => {
  it('flags ../ from a page at the docs root', () => {
    expect(escapesDocsRoot('../x.md', 'index.md')).toBe(true);
  });

  it('allows ../ that stays inside the docs folder', () => {
    expect(escapesDocsRoot('../x.md', 'a/b.md')).toBe(false);
  });

  it('flags ../ that climbs past the docs root from a nested page', () => {
    expect(escapesDocsRoot('../../x.md', 'a/b.md')).toBe(true);
  });

  it('flags a percent-encoded ../', () => {
    expect(escapesDocsRoot('..%2fx.md', 'index.md')).toBe(true);
  });

  it('flags a backslash-rooted reference', () => {
    expect(escapesDocsRoot('\\x.png', 'index.md')).toBe(true);
  });

  it('reads a backslash page path like a forward-slash one', () => {
    expect(escapesDocsRoot('../x.md', 'a\\b.md')).toBe(false);
    expect(escapesDocsRoot('../../x.md', 'a\\b.md')).toBe(true);
  });

  it('leaves root-relative references to their own rules', () => {
    expect(escapesDocsRoot('/img/../../secret.png', 'index.md')).toBe(false);
  });
});
