import { analyzeMatch } from './analyzer.js';
import { ResolvedMatch } from './types/processors.js';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

describe('analyzeMatch', () => {
  it('should analyze a source match with React code', async () => {
    const fixturePath = join(__dirname, '..', 'test', 'fixtures', 'patterns', 'module.tsx');
    const sourceContent = await readFile(fixturePath, 'utf8');

    const resolvedMatch: ResolvedMatch = {
      pattern: 'defaultProps',
      file: '/path/to/bundle.js',
      line: 1,
      column: 0,
      matched: 'defaultProps',
      context: '',
      type: 'source',
      sourceFile: 'test/fixtures/patterns/module.tsx',
      sourceLine: 139,
      sourceColumn: 12,
      sourceContent,
    };

    const result = await analyzeMatch(resolvedMatch);

    expect(result.confidence).toBe('high');
    expect(result.componentType).toBe('function');
  });
});
