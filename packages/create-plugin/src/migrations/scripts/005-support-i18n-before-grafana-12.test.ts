import { describe, expect, it } from 'vitest';
import migrate from './005-support-i18n-before-grafana-12.js';
import { Context } from '../context.js';

describe('005-support-i18n-before-grafana-12.test', () => {
  it('should not update package.json if package.json does not exist', () => {
    const context = new Context('/virtual');
    const initialChanges = context.listChanges();

    migrate(context);

    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should update package.json if it exists and packages are not up to date', async () => {
    const context = new Context('/virtual');
    context.addFile(
      'package.json',
      JSON.stringify({
        dependencies: {
          '@grafana/data': '^12.1.0',
          '@grafana/i18n': '^12.1.0',
          '@grafana/runtime': '^12.1.0',
          '@grafana/ui': '^12.1.0',
          '@grafana/schema': '^12.1.0',
        },
      })
    );

    const result = await migrate(context);

    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson).toEqual({
      dependencies: {
        '@grafana/data': '^12.2.0',
        '@grafana/i18n': '^12.2.0',
        '@grafana/runtime': '^12.2.0',
        '@grafana/ui': '^12.2.0',
        '@grafana/schema': '^12.2.0',
      },
    });
  });

  it('should not update package.json if it exists and packages up to date', async () => {
    const context = new Context('/virtual');
    context.addFile(
      'package.json',
      JSON.stringify({
        dependencies: {
          '@grafana/data': '^12.2.0',
          '@grafana/i18n': '^12.2.0',
          '@grafana/runtime': '^12.2.0',
          '@grafana/ui': '^12.2.0',
          '@grafana/schema': '^12.2.0',
        },
      })
    );

    const result = await migrate(context);

    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson).toEqual({
      dependencies: {
        '@grafana/data': '^12.2.0',
        '@grafana/i18n': '^12.2.0',
        '@grafana/runtime': '^12.2.0',
        '@grafana/ui': '^12.2.0',
        '@grafana/schema': '^12.2.0',
      },
    });
  });
});
