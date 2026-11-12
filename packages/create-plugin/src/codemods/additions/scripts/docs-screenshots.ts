import { join } from 'node:path';
import type { Context } from '../../context.js';
import { TEMPLATES_DIR } from '../../../constants.js';
import { output } from '../../../utils/utils.console.js';
import { additionsDebug, getTemplateDataFromContext, readJsonFile, renderTemplate } from '../../utils.js';
import { appendToAgentInstructions } from '../../utils.agents.js';
import { assertDocsSetUp } from './docs.js';

const SCREENSHOTS_DIR = 'docs-screenshots';
const SCRIPT_NAME = 'docs:screenshots';
const SCRIPT = `playwright test --config ${SCREENSHOTS_DIR}/playwright.config.ts && plugin-docs-cli validate`;
const REQUIRED_DEV_DEPENDENCIES = ['@grafana/plugin-e2e', '@playwright/test'];

interface PackageJson {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

// the agent step takes the screenshots. this sets up the Playwright project they're taken with
export default function docsScreenshots(context: Context): Context {
  const { docsPath, pluginType } = assertDocsSetUp(context, 'docs-screenshots');
  assertE2eSetUp(context);

  const data = { ...getTemplateDataFromContext(context), docsPath };

  const commonDir = join(TEMPLATES_DIR, 'docs', 'common', 'screenshots');
  // added only when missing, because the author owns these after the first run
  for (const file of ['playwright.config.ts', 'helpers.ts']) {
    addFileIfMissing(context, `${SCREENSHOTS_DIR}/${file}`, () => renderTemplate(join(commonDir, file), false, data));
  }
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
    title: 'Before the screenshots are taken',
    body: [
      `Build the plugin and start Grafana, for example with ${run('dev')} and ${run('server')}.`,
      'Set GRAFANA_URL when Grafana runs somewhere other than http://localhost:3000.',
      `Then ${run(SCRIPT_NAME)} takes every screenshot in ${SCREENSHOTS_DIR}/ and validates the docs.`,
    ],
  });

  return context;
}

function assertE2eSetUp(context: Context): void {
  const { devDependencies = {} } = readJsonFile<PackageJson>(context, 'package.json');
  const missing = REQUIRED_DEV_DEPENDENCIES.filter((dependency) => !devDependencies[dependency]);
  if (missing.length > 0 || !context.doesFileExist('playwright.config.ts')) {
    const what = missing.length > 0 ? `${missing.join(' and ')} in devDependencies` : 'playwright.config.ts';
    throw new Error(
      `create-plugin add docs-screenshots takes screenshots with the plugin's e2e setup, but there's no ${what}.\n  Set up e2e testing first, commit the result, then run this again:\n  https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/get-started`
    );
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
