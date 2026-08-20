import { describe, expect, it } from 'vitest';
import { isMetaFile } from './utils.js';

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
  });
});
