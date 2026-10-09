import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { guidesLocation } from './utils.guides.js';

const packageRoot = fileURLToPath(new URL('../../', import.meta.url));

describe('guidesLocation', () => {
  it('points at the guides README shipped with the package', () => {
    const location = guidesLocation(packageRoot, false);

    expect(location).toBe(join('docs', 'README.md'));
    expect(existsSync(resolve(packageRoot, location))).toBe(true);
  });

  it('is relative to cwd, so a hoisted install resolves from the plugin folder', () => {
    const pluginDir = join(packageRoot, 'some', 'plugin');

    expect(guidesLocation(pluginDir, false)).toBe(join('..', '..', 'docs', 'README.md'));
  });

  it('falls back to a version-pinned URL under Yarn PnP', () => {
    const { version } = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf-8'));

    expect(guidesLocation(packageRoot, true)).toBe(
      `https://unpkg.com/@grafana/plugin-docs-cli@${version}/docs/README.md`
    );
  });
});
