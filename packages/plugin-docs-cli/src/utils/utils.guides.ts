import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// src/utils and dist/utils are both two levels below the package root
const PACKAGE_ROOT = new URL('../../', import.meta.url);

/**
 * Where to read the docs guides matching the installed CLI version, relative to `cwd`.
 * Under Yarn PnP the package is inside a zip that agents can't open, so it returns an unpkg URL instead.
 */
export function guidesLocation(cwd = process.cwd(), isPnp = Boolean(process.versions.pnp)): string {
  if (isPnp) {
    const { version } = JSON.parse(readFileSync(new URL('package.json', PACKAGE_ROOT), 'utf-8'));
    return `https://unpkg.com/@grafana/plugin-docs-cli@${version}/docs/README.md`;
  }
  return relative(cwd, fileURLToPath(new URL('docs/README.md', PACKAGE_ROOT)));
}
