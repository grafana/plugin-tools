import { join } from 'node:path';
import * as v from 'valibot';
import type { Context } from '../../context.js';
import { TEMPLATE_PATHS, TEMPLATES_DIR } from '../../../constants.js';
import { output } from '../../../utils/utils.console.js';
import {
  additionsDebug,
  addDependenciesToPackageJson,
  getTemplateDataFromContext,
  readJsonFile,
  renderTemplate,
} from '../../utils.js';
import { appendToAgentInstructions } from '../../utils.agents.js';
import { assertDocsSetUp } from './docs.js';

export const schema = v.object({
  grafanaUrl: v.optional(
    v.pipe(
      v.string(),
      v.url('grafanaUrl must be a URL.'),
      v.regex(/^https?:\/\//, 'grafanaUrl must start with http:// or https://.')
    )
  ),
});

type Options = v.InferOutput<typeof schema>;

const DEFAULT_GRAFANA_URL = 'http://localhost:3000';
const GRAFANA_TIMEOUT_MS = 5000;
const SCREENSHOTS_DIR = 'docs-screenshots';
const HELPERS_PATH = '.config/docs-screenshots/helpers.ts';
const SCRIPT_NAME = 'docs:screenshots';
const SCRIPT = `playwright install chromium && playwright test --config ${SCREENSHOTS_DIR}/playwright.config.ts && plugin-docs-cli validate`;
const PLUGIN_PLAYWRIGHT_CONFIG = 'playwright.config.ts';
// a plugin without them gets `added`. one that has them keeps its version unless it's below `minimum`:
// plugin-e2e 2.2.0 added the userPreferences option the theme uses, and plugin-e2e needs Playwright 1.52
const E2E_DEV_DEPENDENCIES: Record<string, { added: string; minimum: string }> = {
  '@grafana/plugin-e2e': { added: '^4.0.0', minimum: '^2.2.0' },
  '@playwright/test': { added: '^1.62.1', minimum: '^1.52.0' },
};
// the stored session holds a Grafana login cookie, so it must never be committed
const GITIGNORE_ENTRIES = ['/test-results/', '/playwright/.auth/'];

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

// the agent step takes the screenshots. this sets up the Playwright project they're taken with
export default async function docsScreenshots(context: Context, options: Options = {}): Promise<Context> {
  const { docsPath, pluginType } = assertDocsSetUp(context, 'docs-screenshots');
  const grafanaUrl = (options.grafanaUrl ?? process.env.GRAFANA_URL ?? DEFAULT_GRAFANA_URL).replace(/\/+$/, '');
  await assertGrafanaRunning(grafanaUrl, readJsonFile<{ id: string }>(context, 'src/plugin.json').id);
  // the agent session and the Playwright config both read GRAFANA_URL, and the session inherits this process's env
  process.env.GRAFANA_URL = grafanaUrl;

  addE2eDependencies(context);
  addGitignoreEntries(context);

  const data = { ...getTemplateDataFromContext(context), docsPath };

  const commonDir = join(TEMPLATES_DIR, 'docs', 'common', 'screenshots');
  // added only when missing, because the author owns these after the first run
  // a plugin with its own Playwright config shares its URL, user and provisioning with the screenshots
  const configTemplate = context.doesFileExist(PLUGIN_PLAYWRIGHT_CONFIG)
    ? 'playwright.config.ts'
    : 'playwright.config.standalone.ts';
  addFileIfMissing(context, `${SCREENSHOTS_DIR}/playwright.config.ts`, () =>
    renderTemplate(join(commonDir, configTemplate), false, data)
  );
  addHelpers(context, data);
  // a pattern to copy, so it's only added to a folder that has no specs of its own yet
  if (!context.readDir(SCREENSHOTS_DIR).some((file) => file.endsWith('.spec.ts'))) {
    const exampleTemplate = join(TEMPLATES_DIR, 'docs', pluginType, 'screenshots', 'example.spec.ts');
    context.addFile(`${SCREENSHOTS_DIR}/example.spec.ts`, renderTemplate(exampleTemplate, false, data));
  }

  addScreenshotsScript(context);
  appendToAgentInstructions(context, SCRIPT_NAME, buildInstructionsSection(docsPath));

  const run = (script: string) => output.formatCode(`${data.packageManagerName} run ${script}`);
  context.setMessage({
    level: 'log',
    title: 'Taking the screenshots',
    body: [
      `Found Grafana with the plugin at ${grafanaUrl}. Keep it running until the screenshots are taken.`,
      `Later, ${run(SCRIPT_NAME)} takes every screenshot in ${SCREENSHOTS_DIR}/ again and validates the docs.`,
      `It needs Grafana running too. Set GRAFANA_URL when Grafana runs somewhere other than ${DEFAULT_GRAFANA_URL}.`,
    ],
  });

  return context;
}

async function assertGrafanaRunning(grafanaUrl: string, pluginId: string): Promise<void> {
  const notRunning = [
    `create-plugin add docs-screenshots needs Grafana running with the plugin, and found no Grafana at ${grafanaUrl}.`,
    'Build the plugin and start Grafana, for example with the dev and server scripts, then run this again.',
    'Pass --grafanaUrl when Grafana runs somewhere else.',
  ].join('\n');

  const health = await fetchGrafana(`${grafanaUrl}/api/health`);
  if (!health?.ok || !(await isGrafanaHealth(health))) {
    throw new Error(notRunning);
  }

  // only a 404 proves the plugin is missing. a Grafana that requires login answers 401 for any plugin
  const settings = await fetchGrafana(`${grafanaUrl}/api/plugins/${encodeURIComponent(pluginId)}/settings`);
  if (settings?.status === 404) {
    throw new Error(
      [
        `Grafana is running at ${grafanaUrl}, but it hasn't loaded the ${pluginId} plugin.`,
        'Build the plugin and restart Grafana, then run this again.',
      ].join('\n')
    );
  }
}

async function fetchGrafana(url: string): Promise<Response | undefined> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(GRAFANA_TIMEOUT_MS) });
  } catch {
    return undefined;
  }
}

// another server on the port answers too, so the body must look like Grafana's health response
async function isGrafanaHealth(response: Response): Promise<boolean> {
  try {
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null && 'database' in body;
  } catch {
    return false;
  }
}

function addE2eDependencies(context: Context): void {
  const { dependencies = {}, devDependencies = {} } = readJsonFile<PackageJson>(context, 'package.json');
  const versions = Object.fromEntries(
    Object.entries(E2E_DEV_DEPENDENCIES).map(([name, { added, minimum }]) => [
      name,
      dependencies[name] || devDependencies[name] ? minimum : added,
    ])
  );
  addDependenciesToPackageJson(context, {}, versions);
}

function addGitignoreEntries(context: Context): void {
  const existing = context.getFile('.gitignore') ?? '';
  const lines = existing.split('\n').map((line) => line.trim());
  const missing = GITIGNORE_ENTRIES.filter((entry) => !lines.includes(entry) && !lines.includes(entry.slice(1)));
  if (missing.length === 0) {
    return;
  }
  const kept = existing.trimEnd();
  const added = ['# docs screenshots', ...missing].join('\n');
  const content = `${kept ? `${kept}\n\n` : ''}${added}\n`;
  if (context.doesFileExist('.gitignore')) {
    context.updateFile('.gitignore', content);
  } else {
    context.addFile('.gitignore', content);
  }
}

// .config/ belongs to create-plugin, so this always takes the latest version
function addHelpers(context: Context, data: Record<string, unknown>): void {
  const rendered = renderTemplate(join(TEMPLATE_PATHS.common, HELPERS_PATH), false, data);
  if (!context.doesFileExist(HELPERS_PATH)) {
    context.addFile(HELPERS_PATH, rendered);
  } else if (context.getFile(HELPERS_PATH) !== rendered) {
    context.updateFile(HELPERS_PATH, rendered);
  }
}

function addFileIfMissing(context: Context, path: string, render: () => string): void {
  if (context.doesFileExist(path)) {
    additionsDebug(`${path} already exists, skipping`);
    return;
  }
  context.addFile(path, render());
}

function addScreenshotsScript(context: Context): void {
  const packageJson = readJsonFile<PackageJson>(context, 'package.json');
  const scripts = packageJson.scripts ?? {};
  if (scripts[SCRIPT_NAME]) {
    additionsDebug(`${SCRIPT_NAME} already exists in package.json scripts, skipping`);
    return;
  }
  context.updateFile(
    'package.json',
    JSON.stringify({ ...packageJson, scripts: { ...scripts, [SCRIPT_NAME]: SCRIPT } }, null, 2)
  );
}

function buildInstructionsSection(docsPath: string): string {
  return `## Docs screenshots\n\nThe screenshots in \`${docsPath}/img/\` are taken by the Playwright specs in \`${SCREENSHOTS_DIR}/\`. After any change to the plugin's UI, make sure Grafana is running and run the \`${SCRIPT_NAME}\` script, which takes every screenshot again. Look at each image that changed before you finish, and fix a spec that fails or no longer shows what its page says. When you document a new feature and a picture would help, add a spec for it. Refer to \`screenshots.md\` in the plugin docs guides that \`${docsPath}/AGENTS.md\` points to.\n`;
}
