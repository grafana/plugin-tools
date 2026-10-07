import { describe, it, expect } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import { parseMarkdown } from '../parser.js';

function render(markdown: string): string {
  return toHtml(parseMarkdown(markdown).hast);
}

describe('rehypeCallouts', () => {
  it.each([
    ['NOTE', 'note', 'Note'],
    ['TIP', 'tip', 'Tip'],
    ['IMPORTANT', 'important', 'Important'],
    ['WARNING', 'warning', 'Warning'],
    ['CAUTION', 'caution', 'Caution'],
  ])('should turn a [!%s] blockquote into a %s callout', (marker, type, title) => {
    const html = render(`> [!${marker}]\n> Some text.`);

    expect(html).toContain(`<div class="callout callout-${type}" role="note">`);
    expect(html).toContain(`<p class="callout-title">${title}</p>`);
    expect(html).toContain('<p>Some text.</p>');
    expect(html).not.toContain('blockquote');
    expect(html).not.toContain('[!');
  });

  it('should accept a lowercase marker', () => {
    expect(render('> [!note]\n> Some text.')).toContain('callout-note');
  });

  it('should keep inline formatting and later blocks', () => {
    const html = render(
      '> [!NOTE]\n> Only in **Grafana Cloud**.\n>\n> - First\n> - Second\n>\n> ```sql\n> SELECT 1\n> ```'
    );

    expect(html).toContain('<p>Only in <strong>Grafana Cloud</strong>.</p>');
    expect(html).toContain('<li>First</li>');
    expect(html).toContain('<code class="language-sql">SELECT 1');
  });

  it('should drop the marker paragraph when the content starts in the next paragraph', () => {
    const html = render('> [!TIP]\n>\n> Next paragraph.');

    expect(html).toContain('<p class="callout-title">Tip</p>');
    expect(html).toContain('<p>Next paragraph.</p>');
    expect(html).not.toContain('<p></p>');
  });

  it('should leave a blockquote with an unknown type alone', () => {
    const html = render('> [!DANGER]\n> Some text.');

    expect(html).toContain('<blockquote>');
    expect(html).toContain('[!DANGER]');
    expect(html).not.toContain('callout');
  });

  it('should leave a blockquote alone when text follows the marker on the same line', () => {
    const html = render('> [!WARNING] Same line.');

    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('callout');
  });

  it('should leave a blockquote alone when formatted text follows the marker on the same line', () => {
    const html = render('> [!NOTE] **Same line.**');

    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('callout');
  });

  it('should still convert a callout whose content starts with formatting on the next line', () => {
    const html = render('> [!NOTE]\n> **Bold** start.');

    expect(html).toContain('callout-note');
    expect(html).toContain('<p><strong>Bold</strong> start.</p>');
  });

  it('should leave a plain blockquote alone', () => {
    expect(render('> Just a quote.')).toContain('<blockquote>\n<p>Just a quote.</p>\n</blockquote>');
  });

  it('should not treat a marker later in the blockquote as a callout', () => {
    expect(render('> Intro.\n>\n> [!NOTE]\n> Text.')).not.toContain('callout');
  });

  it('should not let authors forge callout markup', () => {
    const html = render('<div class="callout callout-warning" role="note">Fake</div>');

    expect(html).not.toContain('callout');
  });

  it('should keep headings inside a callout in the table of contents', () => {
    const { headings } = parseMarkdown('> [!NOTE]\n> ## Inside\n> Text.');

    expect(headings).toEqual([{ level: 2, id: 'inside', text: 'Inside' }]);
  });
});
