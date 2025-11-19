import { describe, expect, it } from 'vitest';

import { Context } from '../../context.js';
import migrate from './example-addition.js';

describe('example-addition', () => {
  it('should add example script to package.json', () => {
    const context = new Context('/virtual');

    context.addFile('package.json', JSON.stringify({ scripts: {}, dependencies: {}, devDependencies: {} }));

    const result = migrate(context, { featureName: 'testFeature', enabled: true, frameworks: ['react'] });

    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.scripts['example-script']).toBe('echo "Running testFeature"');
  });

  it('should add dev dependency', () => {
    const context = new Context('/virtual');

    context.addFile('package.json', JSON.stringify({ scripts: {}, dependencies: {}, devDependencies: {} }));

    const result = migrate(context, { featureName: 'myFeature', enabled: false, frameworks: ['react'] });

    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.devDependencies['@types/node']).toBe('^20.0.0');
  });

  it('should create feature TypeScript file with options', () => {
    const context = new Context('/virtual');

    context.addFile('package.json', JSON.stringify({ scripts: {}, dependencies: {}, devDependencies: {} }));

    const result = migrate(context, {
      featureName: 'myFeature',
      enabled: false,
      port: 4000,
      frameworks: ['react', 'vue'],
    });

    expect(result.doesFileExist('src/features/myFeature.ts')).toBe(true);
    const featureCode = result.getFile('src/features/myFeature.ts');
    expect(featureCode).toContain('export const myFeature');
    expect(featureCode).toContain('enabled: false');
    expect(featureCode).toContain('port: 4000');
    expect(featureCode).toContain('frameworks: ["react","vue"]');
    expect(featureCode).toContain('myFeature initialized on port 4000');
  });

  it('should delete deprecated file if it exists', () => {
    const context = new Context('/virtual');

    context.addFile('package.json', JSON.stringify({ scripts: {}, dependencies: {}, devDependencies: {} }));
    context.addFile('src/deprecated.ts', 'export const old = true;');

    const result = migrate(context, { featureName: 'testFeature', enabled: true, frameworks: ['react'] });

    expect(result.doesFileExist('src/deprecated.ts')).toBe(false);
  });

  it('should rename old-config.json if it exists', () => {
    const context = new Context('/virtual');

    context.addFile('package.json', JSON.stringify({ scripts: {}, dependencies: {}, devDependencies: {} }));
    context.addFile('src/old-config.json', JSON.stringify({ old: true }));

    const result = migrate(context, { featureName: 'testFeature', enabled: true, frameworks: ['react'] });

    expect(result.doesFileExist('src/old-config.json')).toBe(false);
    expect(result.doesFileExist('src/new-config.json')).toBe(true);
    const newConfig = JSON.parse(result.getFile('src/new-config.json') || '{}');
    expect(newConfig.old).toBe(true);
  });

  it('should not add script if it already exists', () => {
    const context = new Context('/virtual');

    context.addFile(
      'package.json',
      JSON.stringify({
        scripts: { 'example-script': 'existing command' },
        dependencies: {},
        devDependencies: {},
      })
    );

    const result = migrate(context, { featureName: 'testFeature', enabled: true, frameworks: ['react'] });

    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.scripts['example-script']).toBe('existing command');
  });
});
