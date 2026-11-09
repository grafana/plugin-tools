import { describe, it, expect } from 'vitest';
import { readFrontmatter } from './frontmatter.js';

describe('readFrontmatter', () => {
  it('reads the fields and the body after the block', () => {
    expect(readFrontmatter('---\ntitle: A\ndescription: B\n---\n## Hi\n')).toEqual({
      hasBlock: true,
      data: { title: 'A', description: 'B' },
      body: '## Hi\n',
    });
  });

  it('keeps the blank line after the block in the body', () => {
    expect(readFrontmatter('---\ntitle: A\n---\n\n## Hi').body).toBe('\n## Hi');
  });

  it('returns the whole page when there is no block', () => {
    expect(readFrontmatter('## Hi\n')).toEqual({ hasBlock: false, data: {}, body: '## Hi\n' });
  });

  it('reads CRLF line endings', () => {
    const result = readFrontmatter('---\r\ntitle: A\r\n---\r\nbody\r\n');
    expect(result.data).toEqual({ title: 'A' });
    expect(result.body).toBe('body\r\n');
  });

  it('ignores a leading byte order mark', () => {
    const result = readFrontmatter('\uFEFF---\ntitle: A\n---\nbody');
    expect(result.data).toEqual({ title: 'A' });
    expect(result.body).toBe('body');
  });

  it('allows spaces after either fence', () => {
    const result = readFrontmatter('---  \ntitle: A\n--- \t\nbody');
    expect(result.data).toEqual({ title: 'A' });
    expect(result.body).toBe('body');
  });

  it('reads a block that ends the page', () => {
    expect(readFrontmatter('---\ntitle: A\n---')).toEqual({ hasBlock: true, data: { title: 'A' }, body: '' });
  });

  it('reads an empty block', () => {
    expect(readFrontmatter('---\n---\n## Hi')).toEqual({ hasBlock: true, data: {}, body: '## Hi' });
  });

  it('reads a block that holds only comments as empty', () => {
    expect(readFrontmatter('---\n# draft\n\n---\nbody')).toEqual({ hasBlock: true, data: {}, body: 'body' });
  });

  it('closes the block at the first line that holds only ---', () => {
    const result = readFrontmatter('---\ntitle: "a --- b"\n---\nbody\n---\nmore');
    expect(result.data).toEqual({ title: 'a --- b' });
    expect(result.body).toBe('body\n---\nmore');
  });

  it('does not treat a fence with a language as a block', () => {
    expect(readFrontmatter('---yaml\ntitle: A\n---\nbody').hasBlock).toBe(false);
  });

  it('reads numbers as YAML 1.2', () => {
    expect(readFrontmatter('---\nsidebar_position: 010\n---\n').data).toEqual({ sidebar_position: 10 });
  });

  it('reports a block that is never closed', () => {
    const content = '---\ntitle: A\ndescription: B\n\nbody';
    expect(readFrontmatter(content)).toEqual({
      hasBlock: true,
      data: {},
      body: content,
      problem: { kind: 'unclosed', line: 1 },
    });
  });

  it('reports invalid YAML with its line in the page', () => {
    const result = readFrontmatter('---\ntitle: A\ntitle: B\n---\nbody');
    expect(result.data).toEqual({});
    expect(result.body).toBe('body');
    expect(result.problem).toEqual({ kind: 'invalid-yaml', line: 3, message: 'duplicated mapping key' });
  });

  it.each([
    ['a list', '---\n- a\n- b\n---\nbody'],
    ['a string', '---\njust text\n---\nbody'],
    ['a date', '---\n2024-01-02\n---\nbody'],
  ])('reports frontmatter that is %s', (_name, content) => {
    const result = readFrontmatter(content);
    expect(result.data).toEqual({});
    expect(result.body).toBe('body');
    expect(result.problem).toEqual({ kind: 'not-a-mapping', line: 2 });
  });
});
