import { join } from 'node:path';
import { analyzeSourceFiles } from './analyzer.js';
import { extractAllSources } from './source-extractor.js';

describe('analyzeMatch', () => {
  it('should analyze a source match with React code', async () => {
    const fixturePath = join(__dirname, '..', 'test', 'fixtures', 'patterns', 'module.js.map');

    const sourceFile = await extractAllSources([fixturePath]);
    console.log('sourceFile', sourceFile);
    const result = await analyzeSourceFiles(sourceFile);

    expect(result[0].confidence).toBe('high');
    expect(result[0].componentType).toBe('function');
  });
});
