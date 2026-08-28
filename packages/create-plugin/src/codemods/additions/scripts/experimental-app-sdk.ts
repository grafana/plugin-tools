import { fileURLToPath } from 'node:url';
import { parseDocument, stringify, YAMLMap, Scalar } from 'yaml';
import type { Context } from '../../context.js';
import { output } from '../../../utils/utils.console.js';
import { additionsDebug, renderTemplate } from '../../utils.js';
import { getTemplateData } from '../../../utils/utils.templates.js';

// Grafana reads an app-sdk manifest from the plugin bundle, and registers its API server, only when
// these toggles are enabled.
const APP_SDK_FEATURE_TOGGLES = ['appplugins.loadAppManifest', 'appplugins.registerAPIServer'];

// Files copied verbatim from templates/app-sdk. Paths are relative to both the template folder and
// the plugin root.
const TEMPLATE_FILES = [
  '.config/app-sdk/generate-kinds.mjs',
  'kinds/config.cue',
  'kinds/manifest.cue',
  'kinds/example.cue',
  'kinds/cue.mod/module.cue',
  'kinds/README.md',
];

// Points agents at the app-sdk guidance. Only added alongside an existing instructions.md.
const APP_SDK_MD = '.config/AGENTS/app-sdk.md';

/**
 * Adds grafana-app-sdk CUE kind code generation to an existing app plugin.
 *
 * Every step is guarded so re-running is a no-op, and user edits to the scaffolded CUE are never
 * overwritten.
 */
export default function appSdk(context: Context): Context {
  if (!isAppPlugin(context)) {
    return context;
  }

  const changesBefore = Object.keys(context.listChanges()).length;

  addTemplateFiles(context);
  referenceAgentInstructions(context);
  addGenerateScript(context);
  addFeatureToggle(context);

  // Only guide the user when we actually scaffolded something; a re-run should stay quiet.
  if (Object.keys(context.listChanges()).length > changesBefore) {
    printNextSteps();
  }

  return context;
}

/**
 * Kinds are served per app, so codegen only applies to app plugins. A Go backend is not required:
 * Grafana can serve kinds from the bundled manifest alone.
 */
function isAppPlugin(context: Context): boolean {
  const pluginJsonContent = context.getFile('src/plugin.json');

  if (!pluginJsonContent) {
    skip('Could not find src/plugin.json.', ['Run this from the root of your plugin.']);
    return false;
  }

  let pluginJson;
  try {
    pluginJson = JSON.parse(pluginJsonContent);
  } catch (error) {
    additionsDebug(`Failed to parse src/plugin.json: ${error}`);
    skip('Could not parse src/plugin.json.');
    return false;
  }

  if (pluginJson.type !== 'app') {
    skip(`grafana-app-sdk codegen needs an app plugin, but this is a ${pluginJson.type} plugin.`, [
      'The app-sdk serves Kubernetes-style resources from an app plugin.',
    ]);
    return false;
  }

  return true;
}

/**
 * Explains why nothing happened. The runner reports success for a no-op codemod, so without this the
 * user is left guessing.
 */
function skip(title: string, body: string[] = []) {
  output.warning({ title: `Skipping app-sdk: ${title}`, body });
}

function addTemplateFiles(context: Context) {
  for (const file of TEMPLATE_FILES) {
    if (context.doesFileExist(file)) {
      additionsDebug(`${file} already exists. Skipping.`);
      continue;
    }

    // includeWarning is false: the CUE kinds are meant to be edited (declaring your own kinds is the
    // point), and generate-kinds.mjs starts with a shebang, which a prepended comment would break.
    context.addFile(file, renderTemplate(templatePath(file), false));
  }
}

function templatePath(file: string): string {
  return fileURLToPath(new URL(`../../../../templates/app-sdk/${file}`, import.meta.url));
}

/**
 * Points the plugin's agent instructions at the app-sdk ones.
 *
 * On a fresh scaffold this line is rendered into instructions.md by the template. Retrofitted plugins
 * have an instructions.md that predates the flag, so add it here — without it, an agent reading the
 * plugin's instructions has no idea kinds or generated code exist.
 */
function referenceAgentInstructions(context: Context) {
  const path = '.config/AGENTS/instructions.md';
  const instructions = context.getFile(path);

  if (!instructions) {
    additionsDebug(`Could not find ${path}. Skipping the app-sdk reference.`);
    return;
  }

  if (!context.doesFileExist(APP_SDK_MD)) {
    context.addFile(APP_SDK_MD, renderTemplate(templatePath(APP_SDK_MD), false));
  }

  if (instructions.includes(APP_SDK_MD)) {
    return;
  }

  context.updateFile(
    path,
    `${instructions.trimEnd()}\n- This plugin defines its API resources as **CUE kinds** under \`kinds/\`, with TypeScript and Go types generated from them. Read @./${APP_SDK_MD} before changing anything under \`kinds/\` or any generated directory. **Never hand-edit generated code.**\n`
  );
}

/** Adds the `generate:kinds` npm script that runs code generation. */
function addGenerateScript(context: Context) {
  const raw = context.getFile('package.json');

  if (!raw) {
    additionsDebug('Could not find package.json. Skipping the generate:kinds script.');
    return;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(raw);
  } catch (error) {
    additionsDebug(`Failed to parse package.json: ${error}`);
    return;
  }

  if (packageJson.scripts?.['generate:kinds']) {
    additionsDebug('A generate:kinds script already exists. Skipping.');
    return;
  }

  packageJson.scripts = { ...packageJson.scripts, 'generate:kinds': 'node ./.config/app-sdk/generate-kinds.mjs' };
  context.updateFile('package.json', JSON.stringify(packageJson, null, 2));
}

/**
 * Enables the app-sdk manifest feature toggle on the dev server.
 *
 * The toggle goes in the root docker-compose.yaml rather than .config/docker-compose-base.yaml,
 * because the root file is the one users own.
 */
function addFeatureToggle(context: Context) {
  const composePath = 'docker-compose.yaml';
  const composeContent = context.getFile(composePath);

  if (!composeContent) {
    additionsDebug(`Could not find ${composePath}. Skipping the feature toggle.`);
    return;
  }

  // Already set in the base config, so adding it to the root file would be redundant. Note compose
  // replaces (rather than merges) a scalar value across `extends`, so a root value would also mask
  // any other toggles the base file sets.
  const baseComposeContent = context.getFile('.config/docker-compose-base.yaml');
  if (APP_SDK_FEATURE_TOGGLES.every((toggle) => baseComposeContent?.includes(toggle))) {
    additionsDebug(`${APP_SDK_FEATURE_TOGGLES.join(', ')} are already enabled in the base compose file. Skipping.`);
    return;
  }

  const composeData = parseDocument(composeContent);
  const environment = composeData.getIn(['services', 'grafana', 'environment']);

  if (environment !== undefined && !(environment instanceof YAMLMap)) {
    additionsDebug(
      `services.grafana.environment in ${composePath} is not a mapping. Add ${APP_SDK_FEATURE_TOGGLES.join(', ')} to GF_FEATURE_TOGGLES_ENABLE manually.`
    );
    return;
  }

  const grafanaService = composeData.getIn(['services', 'grafana']);
  if (!(grafanaService instanceof YAMLMap)) {
    additionsDebug(`Could not find the grafana service in ${composePath}. Skipping the feature toggle.`);
    return;
  }

  const existing = composeData.getIn(['services', 'grafana', 'environment', 'GF_FEATURE_TOGGLES_ENABLE'], true);
  const existingValue = existing instanceof Scalar ? String(existing.value) : undefined;
  const toggles = existingValue
    ? existingValue
        .split(',')
        .map((toggle) => toggle.trim())
        .filter(Boolean)
    : [];

  const missingToggles = APP_SDK_FEATURE_TOGGLES.filter((toggle) => !toggles.includes(toggle));

  if (missingToggles.length === 0) {
    additionsDebug(`${APP_SDK_FEATURE_TOGGLES.join(', ')} are already enabled. Skipping.`);
    return;
  }

  toggles.push(...missingToggles);
  composeData.setIn(['services', 'grafana', 'environment', 'GF_FEATURE_TOGGLES_ENABLE'], toggles.join(','));

  context.updateFile(composePath, stringify(composeData, { lineWidth: 120, singleQuote: true }));
}

/** Tells the user what to run next. */
function printNextSteps() {
  const { packageManagerName } = getTemplateData();

  output.log({
    title: 'Added grafana-app-sdk code generation. Next steps:',
    body: [
      'Edit your kinds in ./kinds (start with kinds/example.cue), then run:',
      `  ${packageManagerName} run generate:kinds`,
      'See ./kinds/README.md for the full workflow.',
    ],
  });
}
