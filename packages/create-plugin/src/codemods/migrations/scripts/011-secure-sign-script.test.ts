import { describe, expect, it } from 'vitest';
import migrate from './011-secure-sign-script.js';
import { Context } from '../../context.js';

describe('011-secure-sign-script', () => {
  it('should replace insecure sign script and add @grafana/sign-plugin devDependency', () => {
    const context = new Context('/virtual');
    context.addFile(
      'package.json',
      JSON.stringify({
        scripts: {
          sign: 'npx --yes @grafana/sign-plugin@latest',
        },
        devDependencies: {
          '@grafana/tsconfig': '^2.0.1',
        },
      })
    );

    const result = migrate(context);
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(packageJson.scripts.sign).toBe('sign-plugin');
    expect(packageJson.devDependencies['@grafana/sign-plugin']).toBe('^3.2.2');
    expect(packageJson.devDependencies['@grafana/tsconfig']).toBe('^2.0.1');
  });

  it('should preserve trailing CLI flags when rewriting the sign script', () => {
    const context = new Context('/virtual');
    context.addFile(
      'package.json',
      JSON.stringify({
        scripts: {
          sign: 'npx --yes @grafana/sign-plugin@latest --rootUrls https://example.com/grafana',
        },
        devDependencies: {},
      })
    );

    const result = migrate(context);
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(packageJson.scripts.sign).toBe('sign-plugin --rootUrls https://example.com/grafana');
    expect(packageJson.devDependencies['@grafana/sign-plugin']).toBe('^3.2.2');
  });

  it('should match the -y short flag as well as --yes', () => {
    const context = new Context('/virtual');
    context.addFile(
      'package.json',
      JSON.stringify({
        scripts: {
          sign: 'npx -y @grafana/sign-plugin@latest',
        },
        devDependencies: {},
      })
    );

    const result = migrate(context);
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(packageJson.scripts.sign).toBe('sign-plugin');
  });

  it('should leave a customised sign script alone but still add the devDependency', () => {
    const context = new Context('/virtual');
    const customSign = './scripts/my-custom-sign.sh';
    context.addFile(
      'package.json',
      JSON.stringify({
        scripts: {
          sign: customSign,
        },
        devDependencies: {},
      })
    );

    const result = migrate(context);
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(packageJson.scripts.sign).toBe(customSign);
    expect(packageJson.devDependencies['@grafana/sign-plugin']).toBe('^3.2.2');
  });

  it('should be a no-op when already migrated', () => {
    const context = new Context('/virtual');
    const original = JSON.stringify({
      scripts: {
        sign: 'sign-plugin',
      },
      devDependencies: {
        '@grafana/sign-plugin': '^3.2.2',
      },
    });
    context.addFile('package.json', original);

    const result = migrate(context);

    expect(result.getFile('package.json')).toBe(original);
  });

  it('should be a no-op when package.json does not exist', () => {
    const context = new Context('/virtual');

    const result = migrate(context);

    expect(result.hasChanges()).toBe(false);
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile(
      'package.json',
      JSON.stringify({
        scripts: {
          sign: 'npx --yes @grafana/sign-plugin@latest',
        },
        devDependencies: {},
      })
    );

    await expect(migrate).toBeIdempotent(context);
  });
});
