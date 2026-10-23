import { describe, expect, it } from 'vitest';
import migrate from './019-rename-rspack-feature-flag.js';
import { Context } from '../../context.js';

const ROOT_CPRC_PATH = '.config/.cprc.json';
const USER_CPRC_PATH = '.cprc.json';

function setupContext(files: { root?: object; user?: object }) {
  const context = new Context('/virtual');
  if (files.root) {
    context.addFile(ROOT_CPRC_PATH, JSON.stringify(files.root, null, 2));
  }
  if (files.user) {
    context.addFile(USER_CPRC_PATH, JSON.stringify(files.user, null, 2));
  }
  return context;
}

function readFeatures(context: Context, path: string) {
  return JSON.parse(context.getFile(path) || '{}').features;
}

describe('019-rename-rspack-feature-flag', () => {
  it('should rename the flag in .config/.cprc.json', () => {
    const result = migrate(setupContext({ root: { version: '7.9.0', features: { useExperimentalRspack: true } } }));

    expect(readFeatures(result, ROOT_CPRC_PATH)).toEqual({ useRspack: true });
  });

  it('should move the flag from the plugin .cprc.json to .config/.cprc.json', () => {
    const result = migrate(
      setupContext({
        root: { version: '7.9.0', features: {} },
        user: { features: { bundleGrafanaUI: false, useExperimentalRspack: true } },
      })
    );

    expect(readFeatures(result, ROOT_CPRC_PATH)).toEqual({ useRspack: true });
    expect(readFeatures(result, USER_CPRC_PATH)).toEqual({ bundleGrafanaUI: false });
  });

  it('should remove a disabled flag without turning rspack on', () => {
    const result = migrate(
      setupContext({
        root: { version: '7.9.0', features: {} },
        user: { features: { bundleGrafanaUI: false, useExperimentalRspack: false } },
      })
    );

    expect(readFeatures(result, ROOT_CPRC_PATH)).toEqual({});
    expect(readFeatures(result, USER_CPRC_PATH)).toEqual({ bundleGrafanaUI: false });
  });

  it('should keep the version and other feature flags', () => {
    const result = migrate(
      setupContext({ root: { version: '7.9.0', features: { bundleGrafanaUI: true, useExperimentalRspack: true } } })
    );

    expect(JSON.parse(result.getFile(ROOT_CPRC_PATH) || '{}')).toEqual({
      version: '7.9.0',
      features: { bundleGrafanaUI: true, useRspack: true },
    });
  });

  it('should not rewrite config files that never had the flag', () => {
    const context = setupContext({
      root: { version: '7.9.0', features: {} },
      user: { features: { bundleGrafanaUI: false } },
    });
    // formatting a rewrite would change, so an untouched file keeps it
    context.updateFile(ROOT_CPRC_PATH, '{"version":"7.9.0","features":{}}');
    context.updateFile(USER_CPRC_PATH, '{"features":{"bundleGrafanaUI":false}}');

    const result = migrate(context);

    expect(result.getFile(ROOT_CPRC_PATH)).toBe('{"version":"7.9.0","features":{}}');
    expect(result.getFile(USER_CPRC_PATH)).toBe('{"features":{"bundleGrafanaUI":false}}');
  });

  it('should not fail when neither config file exists', () => {
    const result = migrate(new Context('/virtual'));

    expect(result.hasChanges()).toBe(false);
  });

  it('should be idempotent', async () => {
    await expect(migrate).toBeIdempotent(
      setupContext({
        root: { version: '7.9.0', features: { useExperimentalRspack: true } },
        user: { features: { bundleGrafanaUI: false, useExperimentalRspack: false } },
      })
    );
  });
});
