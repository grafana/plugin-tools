import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { toHtml } from 'hast-util-to-html';
import type { Root } from 'hast';
import { VFile } from 'vfile';
import { rehypeRawAllowlist } from './rehype-raw-allowlist.js';

// no sanitizer here, so these tests show what the plugin removes on its own
function render(markdown: string): string {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype, { allowDangerousHtml: true });
  const transform = rehypeRawAllowlist();
  return toHtml(transform(processor.runSync(processor.parse(markdown)) as Root, new VFile())).trim();
}

describe('rehypeRawAllowlist', () => {
  it('should keep details, summary and markdown inside them', () => {
    expect(render('<details>\n<summary>More</summary>\n\nSome **markdown**.\n\n</details>')).toBe(
      '<details>\n<summary>More</summary>\n<p>Some <strong>markdown</strong>.</p>\n</details>'
    );
  });

  it('should keep br and hr', () => {
    expect(render('one<br>two\n\n<hr>')).toBe('<p>one<br>two</p>\n<hr>');
  });

  it('should keep only open on details and drop every other attribute', () => {
    expect(
      render(
        '<details open class="x" id="dataLayer" ontoggle="alert(1)">\n<summary name="n" style="color:red">More</summary>\n\nText\n\n</details>'
      )
    ).toBe('<details open>\n<summary>More</summary>\n<p>Text</p>\n</details>');
  });

  it.each([
    ['strong', 'Some <strong>bold</strong> text', '<p>Some bold text</p>'],
    ['an image', 'Some <img src="https://example.com/x.png"> text', '<p>Some  text</p>'],
    ['a link', 'Some <a href="https://example.com">link</a> text', '<p>Some link text</p>'],
  ])('should remove inline %s written as raw HTML', (_name, markdown, expected) => {
    expect(render(markdown)).toBe(expected);
  });

  it.each([
    ['a table', '<table><tr><td>cell</td></tr></table>'],
    ['a heading', '<h2 id="dataLayer">Heading</h2>'],
    ['a div', '<div class="note">note</div>'],
  ])('should remove %s written as a raw HTML block, with its content', (_name, markdown) => {
    expect(render(`${markdown}\n\nAfter`)).toBe('<p>After</p>');
  });

  it('should keep markdown text between removed inline tags', () => {
    expect(render('Press <kbd>Enter</kbd> now.')).toBe('<p>Press Enter now.</p>');
  });

  it.each([
    ['a paragraph', '<kbd>Enter</kbd> to save.', '<p>Enter to save.</p>'],
    ['a paragraph with a kept tag', '<br>line two', '<p><br>line two</p>'],
    ['a list item', '- <kbd>K</kbd> item', '<ul>\n<li>K item</li>\n</ul>'],
  ])('should keep %s that starts with a raw tag', (_name, markdown, expected) => {
    expect(render(markdown)).toBe(expected);
  });

  it('should treat raw HTML with a forged markdown marker as raw', () => {
    expect(render('<div data-plugin-docs-markdown="anything">note</div>\n\nAfter')).toBe('<p>After</p>');
  });

  it('should not leave the markdown marker on the output', () => {
    expect(render('## Title\n\n**bold** [link](https://example.com)')).not.toContain('data-plugin-docs-markdown');
  });

  it('should keep markdown nested inside a removed block', () => {
    expect(render('<div class="note">\n\nSome **markdown**.\n\n</div>')).toBe('<p>Some <strong>markdown</strong>.</p>');
  });

  it('should remove an image hidden after a comment that closes early', () => {
    expect(render('<!-- a --!><img src=x onerror=alert(1)> -->\n\nAfter')).toBe('<p>After</p>');
  });

  it.each(['<script>alert(1)</script>', '<style>p { display: none }</style>', '<textarea>x</textarea>', '<plaintext>'])(
    'should drop %s and keep the markdown after it',
    (markdown) => {
      expect(render(`${markdown}\n\n## After\n\nText`)).toBe('<h2>After</h2>\n<p>Text</p>');
    }
  );

  it('should remove a summary outside details', () => {
    expect(render('<summary>Alone</summary>\n\nText')).toBe('<p>Text</p>');
  });

  it('should keep markdown elements that have no position, such as footnotes', () => {
    const html = render('Text.[^1]\n\n[^1]: A note.');

    expect(html).toContain('<section data-footnotes');
    expect(html).toContain('<li id="user-content-fn-1">');
  });

  it('should drop a raw node without a position', () => {
    const tree: Root = {
      type: 'root',
      children: [{ type: 'raw', value: '<img src="x">' } as unknown as Root['children'][number]],
    };

    expect(toHtml(rehypeRawAllowlist()(tree, new VFile()))).toBe('');
  });
});
