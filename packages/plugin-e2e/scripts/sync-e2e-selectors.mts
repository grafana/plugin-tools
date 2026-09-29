/**
 * Vendors the @grafana/e2e-selectors source from grafana/grafana into src/selectors/vendored.
 *
 * plugin-e2e needs the selector tree as values (the fallback for Grafana versions that don't serve
 * e2e-selectors.json at runtime) and as types (autocomplete for plugin authors), neither of which can
 * be derived from the runtime JSON. Rather than depending on the npm package, we copy its source.
 *
 * All files are fetched from a single commit and written only once every fetch has succeeded. The code
 * is copied verbatim apart from a header and the semver import, which is pointed at our own helpers.
 * The run fails if upstream starts importing a file or package that isn't vendored here.
 *
 * Usage: npm run sync-selectors -w @grafana/plugin-e2e [-- --ref <branch|tag|sha>]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { parseArgs } from 'node:util';

const REPO = 'grafana/grafana';
const SOURCE_DIR = 'packages/grafana-e2e-selectors/src';
const TARGET_DIR = join(import.meta.dirname, '../src/selectors/vendored');
const FILES = [
  'resolver.ts',
  'types/index.ts',
  'types/selectors.ts',
  'selectors/components.ts',
  'selectors/pages.ts',
  'selectors/constants.ts',
];
// plugin-e2e ships its own semver helpers (src/utils/version.ts) instead of depending on semver
const PACKAGE_REWRITES: Record<string, string> = { semver: join(import.meta.dirname, '../src/utils/version') };
const IMPORT_REGEX = /^\s*(?:import|export)\b[^'"]*?from\s+['"]([^'"]+)['"]/gm;

const { values } = parseArgs({ options: { ref: { type: 'string', default: 'main' } } });

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'User-Agent': 'grafana-plugin-e2e-sync' } });
  if (!response.ok) {
    throw new Error(`${url} responded ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function resolveSha(ref: string): Promise<string> {
  const commit = JSON.parse(await fetchText(`https://api.github.com/repos/${REPO}/commits/${ref}`));
  return commit.sha;
}

// fails if upstream starts importing a file or package we don't vendor, so the copy never silently breaks
function localizeImports(file: string, content: string): string {
  return content.replace(IMPORT_REGEX, (statement, specifier: string) => {
    if (specifier.startsWith('.')) {
      const resolved = posix.join(posix.dirname(file), specifier);
      if (!FILES.some((f) => f === `${resolved}.ts` || f === `${resolved}/index.ts`)) {
        throw new Error(`${file} imports ${specifier}, which is not vendored. Add it to FILES.`);
      }
      return statement;
    }
    const replacement = PACKAGE_REWRITES[specifier];
    if (!replacement) {
      throw new Error(`${file} imports package ${specifier}, which plugin-e2e does not depend on.`);
    }
    const localPath = relative(dirname(join(TARGET_DIR, file)), replacement)
      .split(sep)
      .join('/');
    return statement.replace(specifier, localPath.startsWith('.') ? localPath : `./${localPath}`);
  });
}

const sha = await resolveSha(values.ref);
const sources = await Promise.all(
  FILES.map(async (file) => {
    const content = await fetchText(`https://raw.githubusercontent.com/${REPO}/${sha}/${SOURCE_DIR}/${file}`);
    return { file, content: localizeImports(file, content) };
  })
);

for (const { file, content } of sources) {
  const target = join(TARGET_DIR, file);
  const header = `// Vendored from ${REPO}@${sha}/${SOURCE_DIR}/${file}. Do not edit - run \`npm run sync-selectors\`.\n`;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, header + content);
}

execFileSync('npx', ['prettier', '--write', TARGET_DIR], { stdio: 'inherit' });
console.log(`Synced ${FILES.length} files from ${REPO}@${sha}`);
