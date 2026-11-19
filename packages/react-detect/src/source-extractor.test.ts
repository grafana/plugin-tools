import { describe, it, expect } from 'vitest';
import { bundlesJsxRuntime } from './source-extractor.js';
import { SourceFile } from './types/processors.js';

const source = (path: string, packageName?: string): SourceFile => ({
  path,
  content: '',
  type: packageName ? 'dependency' : 'source',
  packageName,
  bundledFilePath: 'dist/module.js',
});

describe('bundlesJsxRuntime', () => {
  it('is true when react/jsx-runtime is bundled', () => {
    const sources = [
      source('webpack://my-app/../node_modules/react/jsx-runtime.js', 'react'),
      source('webpack://my-app/../node_modules/react/cjs/react-jsx-runtime.production.js', 'react'),
    ];

    expect(bundlesJsxRuntime(sources)).toBe(true);
  });

  it('is true when only react/jsx-dev-runtime is bundled', () => {
    const sources = [source('webpack://my-app/../node_modules/react/jsx-dev-runtime.js', 'react')];

    expect(bundlesJsxRuntime(sources)).toBe(true);
  });

  it('is false when react/jsx-runtime is external and only imported by dependencies', () => {
    const sources = [
      source('webpack://my-app/../node_modules/@floating-ui/react/dist/floating-ui.react.mjs', '@floating-ui/react'),
      source('webpack://my-app/./src/module.tsx'),
    ];

    expect(bundlesJsxRuntime(sources)).toBe(false);
  });
});
