import { getSourceFilePath } from './analyzer.js';

describe('getSourceFilePath', () => {
  it('should resolve webpack path relative to pluginRoot', () => {
    const pluginRoot = '/path/to/plugin';
    const result = getSourceFilePath('webpack://my-plugin/src/Panel.tsx', pluginRoot);

    console.log('Input:', 'webpack://my-plugin/src/Panel.tsx');
    console.log('Plugin root:', pluginRoot);
    console.log('Result:', result);

    expect(result).toBe('src/Panel.tsx');
  });

  it('should resolve relative path', () => {
    const pluginRoot = '/path/to/plugin';
    const result = getSourceFilePath('src/Panel.tsx', pluginRoot);

    expect(result).toBe('src/Panel.tsx');
  });

  it('should handle node_modules paths', () => {
    const pluginRoot = '/path/to/plugin';
    const result = getSourceFilePath('node_modules/react-select/dist/Select.js', pluginRoot);

    expect(result).toBe('node_modules/react-select/dist/Select.js');
  });
});
