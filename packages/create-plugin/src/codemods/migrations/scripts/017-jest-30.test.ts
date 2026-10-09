import { describe, expect, it } from 'vitest';
import migrate from './017-jest-30.js';
import { Context } from '../../context.js';

function setupContext(devDependencies: Record<string, string>) {
  const context = new Context('/virtual');
  context.addFile('package.json', JSON.stringify({ devDependencies }));
  return context;
}

describe('017-jest-30', () => {
  it('should bump jest, jest-environment-jsdom and @types/jest to v30', () => {
    const result = migrate(
      setupContext({ jest: '^29.7.0', 'jest-environment-jsdom': '^29.7.0', '@types/jest': '^29.5.0' })
    );
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(packageJson.devDependencies).toEqual({
      '@types/jest': '^30.0.0',
      jest: '^30.5.0',
      'jest-environment-jsdom': '^30.5.0',
    });
  });

  it('should not add jest packages the plugin does not use', () => {
    const result = migrate(setupContext({ jest: '^29.7.0' }));
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(packageJson.devDependencies).toEqual({ jest: '^30.5.0' });
  });

  it('should not downgrade newer versions', () => {
    const result = migrate(setupContext({ jest: '^31.0.0' }));
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(packageJson.devDependencies).toEqual({ jest: '^31.0.0' });
  });

  it('should not modify anything when jest is not installed', () => {
    const result = migrate(setupContext({ vitest: '^4.0.0' }));
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(packageJson.devDependencies).toEqual({ vitest: '^4.0.0' });
  });

  it('should be idempotent', async () => {
    await expect(migrate).toBeIdempotent(
      setupContext({ jest: '^29.7.0', 'jest-environment-jsdom': '^29.7.0', '@types/jest': '^29.5.0' })
    );
  });
});
