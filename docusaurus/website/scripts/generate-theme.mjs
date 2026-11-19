import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { flattenTheme } from './theme-tokens.mjs';

const THEME_ID = 'visual_refresh_dark';
const REGISTRY_PATH = 'packages/grafana-data/dist/esm/themes/registry.mjs';
const OUTPUT_PATH = fileURLToPath(new URL('../src/css/theme.css', import.meta.url));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function getCheckoutSha(checkoutPath) {
  try {
    return execFileSync('git', ['-C', checkoutPath, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return fail(`${checkoutPath} is not a git checkout.`);
  }
}

function renderCss(tokens, sha) {
  const header = [
    '/*',
    ` * Generated from grafana/grafana@${sha} (theme: ${THEME_ID}).`,
    ' * Do not edit by hand. Regenerate with:',
    ' *   npm run generate:theme -w website -- <path-to-grafana-checkout>',
    ' * Font sizes, weights, and line heights are pinned in scripts/theme-tokens.mjs.',
    ' */',
  ].join('\n');
  const declarations = Object.entries(tokens).map(([name, value]) => `  --${name}: ${value};`);
  return `${header}\n:root {\n${declarations.join('\n')}\n}\n`;
}

async function main() {
  const [checkoutArg] = process.argv.slice(2);
  if (!checkoutArg) {
    return fail('Usage: npm run generate:theme -w website -- <path-to-grafana-checkout>');
  }

  const checkoutPath = resolve(checkoutArg);
  const registryFile = resolve(checkoutPath, REGISTRY_PATH);
  if (!existsSync(registryFile)) {
    return fail(
      `Could not find ${REGISTRY_PATH} in ${checkoutPath}.\nBuild @grafana/data in the checkout first (for example: yarn nx build @grafana/data).`
    );
  }

  const { getThemeById } = await import(pathToFileURL(registryFile).href);
  const theme = getThemeById(THEME_ID);
  if (theme.colors.mode !== 'dark') {
    return fail(`Expected ${THEME_ID} to be a dark theme but got mode "${theme.colors.mode}".`);
  }

  const sha = getCheckoutSha(checkoutPath);
  writeFileSync(OUTPUT_PATH, renderCss(flattenTheme(theme), sha));
  console.log(`Wrote ${OUTPUT_PATH} from grafana/grafana@${sha}`);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
