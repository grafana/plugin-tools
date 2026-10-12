import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { guidesLocation } from './utils.guides.js';

const packageRoot = fileURLToPath(new URL('../../', import.meta.url));

describe('guidesLocation', () => {
  it('points at the guides index shipped with the package', () => {
    const location = guidesLocation(packageRoot, false);

    expect(location).toBe(join('docs', 'index.md'));
    expect(existsSync(resolve(packageRoot, location))).toBe(true);
  });

  it('is relative to cwd, so a hoisted install resolves from the plugin folder', () => {
    const pluginDir = join(packageRoot, 'some', 'plugin');

    expect(guidesLocation(pluginDir, false)).toBe(join('..', '..', 'docs', 'index.md'));
  });

  it('falls back to a version-pinned GitHub URL under Yarn PnP', () => {
    const { version } = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf-8'));

    expect(guidesLocation(packageRoot, true)).toBe(
      `https://github.com/grafana/plugin-tools/blob/@grafana/plugin-docs-cli@${version}/packages/plugin-docs-cli/docs/index.md`
    );
  });
});
