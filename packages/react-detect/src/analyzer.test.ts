import { getSourceFilePath } from './analyzer.js';
import { join } from 'path';

describe('readSourceFile', () => {
  it('should read a relative source file', () => {
    const pluginRoot = join(__dirname, '../test/fixtures/patterns');
    const content = getSourceFilePath('src/module.tsx', pluginRoot);
    console.log(content);
    expect(content).toContain('defaultProps');
  });

  it('should handle webpack:// paths', () => {
    const pluginRoot = join(__dirname, '../test/fixtures/patterns');
    const content = getSourceFilePath('webpack://my-plugin/src/module.tsx', pluginRoot);
    console.log(content);
    expect(content).toBe('src/module.tsx');
  });
});
