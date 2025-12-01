import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { resolveMatch } from './source-map-resolver.js';
import { RawMatch } from './types/processors.js';
import { readFileSync } from 'fs';
import { parseFile } from './parser.js';
import { findDefaultProps } from './patterns/matcher.js';

describe('resolveMatch', () => {
  it('should resolve bundled code to original source', async () => {
    const fixturePath = join(__dirname, '../test/fixtures/patterns/module.defaultProps.js');
    const code = readFileSync(fixturePath, 'utf-8');
    const ast = parseFile(code, fixturePath);
    const [rawMatch] = findDefaultProps(ast, code, fixturePath);

    const result = await resolveMatch(rawMatch);

    expect(result.type).toBe('source');
    if (result.type === 'source') {
      expect(result.sourceFile).toContain('module.tsx');
    }
  });

  it('should return unknown when source map not found', async () => {
    const rawMatch: RawMatch = {
      pattern: 'defaultProps',
      file: '/nonexistent/module.js',
      line: 1,
      column: 0,
      matched: 'defaultProps',
      context: '',
    };
    const result = await resolveMatch(rawMatch);

    expect(result.type).toBe('unknown');
  });
});
