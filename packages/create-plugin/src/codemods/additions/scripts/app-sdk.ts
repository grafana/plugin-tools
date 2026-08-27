import { fileURLToPath } from 'node:url';
import { parseDocument, stringify, YAMLMap, Scalar } from 'yaml';
import type { Context } from '../../context.js';
import { output } from '../../../utils/utils.console.js';
import { additionsDebug, renderTemplate } from '../../utils.js';

// Grafana reads an app-sdk manifest from the plugin bundle, and registers its API server, only when
// these toggles are enabled.
const APP_SDK_FEATURE_TOGGLES = ['appplugins.loadAppManifest', 'appplugins.registerAPIServer'];

// Files copied verbatim from templates/app-sdk. Paths are relative to both the template folder and
// the plugin root.
const TEMPLATE_FILES = [
  'scripts/generate-kinds.mjs',
  '.config/AGENTS/app-sdk.md',
  'kinds/config.cue',
  'kinds/manifest.cue',
  'kinds/example.cue',
  'kinds/cue.mod/module.cue',
  'kinds/README.md',
];

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

  addTemplateFiles(context, hasGoBackend(context));
  referenceAgentInstructions(context);
  addGenerateScript(context);
  addFeatureToggle(context);
  wireGoBackend(context);

  // Only guide the user when we actually scaffolded something; a re-run should stay quiet.
  if (Object.keys(context.listChanges()).length > changesBefore) {
    printNextSteps(hasGoBackend(context));
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

function addTemplateFiles(context: Context, hasGoBackend: boolean) {
  for (const file of TEMPLATE_FILES) {
    if (context.doesFileExist(file)) {
      additionsDebug(`${file} already exists. Skipping.`);
      continue;
    }

    // includeWarning is false: unlike the tool-managed files in .config, these are meant to be
    // edited — declaring your own kinds is the point.
    let content = renderTemplate(templatePath(file), false);

    // Applied here, rather than as a later context.updateFile() pass, because a file added and then
    // updated within the same codemod run is staged as changeType 'update' — losing the fact its
    // directory (kinds/) doesn't exist on disk yet, which would make the write fail. Baking the Go
    // config straight into the freshly-rendered content sidesteps that entirely.
    if (file === 'kinds/config.cue' && hasGoBackend) {
      content = enableGoCodegenIn(content) ?? content;
    }

    context.addFile(file, content);
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

  if (instructions.includes('AGENTS/app-sdk.md')) {
    return;
  }

  context.updateFile(
    path,
    `${instructions.trimEnd()}\n- This plugin defines its API resources as **CUE kinds** under \`kinds/\`, with TypeScript and Go types generated from them. Read @./.config/AGENTS/app-sdk.md before changing anything under \`kinds/\` or any generated directory. **Never hand-edit generated code.**\n`
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

  packageJson.scripts = { ...packageJson.scripts, 'generate:kinds': 'node ./scripts/generate-kinds.mjs' };
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

/**
 * Enables Go code generation and wires the generated kinds into the Go backend, for app plugins that
 * have one. Plugins without a backend keep the frontend-only `goEnabled: false` config untouched.
 */
function wireGoBackend(context: Context) {
  if (!hasGoBackend(context)) {
    additionsDebug('No Go backend found. Skipping Go code generation and main.go wiring.');
    return;
  }

  enableGoCodegen(context);
  addAppProvider(context);
  wireMainGo(context);
  addGoModDependency(context);
}

// Pinned to pseudo-versions rather than tagged releases: plugin.Run and simple.NewAppProvider
// (https://github.com/grafana/grafana-app-sdk/pull/1516, merged 2026-08-27 at commit 9c1ef77)
// haven't shipped in a tagged release of either module yet. `plugin/` is a separate Go module nested
// in the grafana-app-sdk repo, versioned independently of the root module — hence the two different
// version prefixes below, both pinned to the same commit. Once go.mod has *a* requirement for each,
// `go mod tidy` (which printNextSteps tells the user to run) resolves exact versions and go.sum
// entries for everything actually needed.
const GRAFANA_APP_SDK_VERSION = 'v0.59.1-0.20260827170158-9c1ef7716f5a';
const GRAFANA_APP_SDK_PLUGIN_VERSION = 'v0.17.3-0.20260827170158-9c1ef7716f5a';

/**
 * Adds github.com/grafana/grafana-app-sdk and its plugin/ submodule to go.mod. The generated Go kind
 * types, provider.go, and main.go all import them, but the scaffolded backend's go.mod has no reason
 * to know about either until app-sdk is added.
 *
 * Only adds the require lines — go.sum entries and any transitive requirements (k8s.io/apimachinery,
 * k8s.io/kube-openapi, ...) still need `go mod tidy`, which this doesn't run itself.
 */
function addGoModDependency(context: Context) {
  const path = 'go.mod';
  const content = context.getFile(path);

  if (!content) {
    additionsDebug(`Could not find ${path}. Skipping the grafana-app-sdk dependency.`);
    return;
  }

  if (content.includes('github.com/grafana/grafana-app-sdk ')) {
    additionsDebug(`${path} already requires grafana-app-sdk. Skipping.`);
    return;
  }

  const marker = 'require github.com/grafana/grafana-plugin-sdk-go';
  const markerIndex = content.indexOf(marker);

  if (markerIndex === -1) {
    additionsDebug(`${path} does not match the expected require block shape. Skipping.`);
    return;
  }

  const lineEnd = content.indexOf('\n', markerIndex);
  const insertAt = lineEnd === -1 ? content.length : lineEnd + 1;

  const newRequires =
    `require github.com/grafana/grafana-app-sdk ${GRAFANA_APP_SDK_VERSION}\n` +
    `require github.com/grafana/grafana-app-sdk/plugin ${GRAFANA_APP_SDK_PLUGIN_VERSION}\n`;

  context.updateFile(path, `${content.slice(0, insertAt)}${newRequires}${content.slice(insertAt)}`);
}

/**
 * Scaffolds pkg/provider/provider.go: the app.Provider/app.App wiring that plugin.Run needs, built
 * from the generated manifest and the example kind. Named "provider", not "app", so it doesn't
 * collide with the app-sdk's own `app` package and force an import alias everywhere it's used.
 *
 * Not overwritten on a re-run — like kinds/*.cue, it's meant to be edited as the plugin adds
 * validators, mutators, or more kinds.
 */
function addAppProvider(context: Context) {
  const path = 'pkg/provider/provider.go';

  if (context.doesFileExist(path)) {
    additionsDebug(`${path} already exists. Skipping.`);
    return;
  }

  context.addFile(path, renderTemplate(templatePath(path), false));
}

/** A Go backend is declared by `backend: true` in src/plugin.json, same as the rest of create-plugin. */
function hasGoBackend(context: Context): boolean {
  const pluginJsonContent = context.getFile('src/plugin.json');

  if (!pluginJsonContent) {
    return false;
  }

  try {
    return JSON.parse(pluginJsonContent).backend === true;
  } catch (error) {
    additionsDebug(`Failed to parse src/plugin.json: ${error}`);
    return false;
  }
}

/**
 * Flips `codegen.goEnabled` on and adds a Go output path in kinds/config.cue, for when the file
 * already existed on disk before this run (e.g. a Go backend added after app-sdk was already set
 * up). If config.cue is being scaffolded fresh in this same run, addTemplateFiles bakes this
 * transform into its content directly instead of calling this — see the comment there.
 */
function enableGoCodegen(context: Context) {
  const path = 'kinds/config.cue';
  const content = context.getFile(path);

  if (!content) {
    additionsDebug(`Could not find ${path}. Skipping Go code generation config.`);
    return;
  }

  const updated = enableGoCodegenIn(content);

  if (updated === undefined) {
    return;
  }

  context.updateFile(path, updated);
}

/**
 * Pure string transform: flips `codegen.goEnabled` on and adds a Go output path. Returns undefined
 * if Go codegen is already enabled or the content doesn't match the expected app-sdk config shape.
 */
function enableGoCodegenIn(content: string): string | undefined {
  const path = 'kinds/config.cue';

  if (content.includes('goEnabled: true')) {
    additionsDebug(`${path} already has Go code generation enabled. Skipping.`);
    return undefined;
  }

  const goDisabledBlock =
    '\t\t// This plugin has no Go backend, so skip Go code generation entirely: only TypeScript and\n' +
    '\t\t// the definitions below are emitted, and no Go toolchain is needed to generate them.\n' +
    '\t\tgoEnabled: false';

  if (!content.includes(goDisabledBlock)) {
    additionsDebug(`${path} does not match the expected app-sdk config shape. Skipping.`);
    return undefined;
  }

  const goEnabledBlock =
    '\t\t// Generated Go types land alongside the plugin backend.\n' +
    '\t\tgoEnabled: true\n' +
    '\t\tgoGenPath: "pkg/generated/"';

  return content.replace(goDisabledBlock, goEnabledBlock);
}

// Matches the backend-app template's `if err := app.Manage(...); err != nil { ... }` statement,
// capturing the plugin ID, app factory, and error-handling body so they can be preserved verbatim.
const APP_MANAGE_STATEMENT_REGEX =
  /if err := app\.Manage\((".*?"), (\S+), app\.ManageOpts\{\}\); err != nil \{\n(\t+[\s\S]*?\n)\t\}/;

/**
 * Wires the app-sdk's plugin.Run helper into main.go, replacing the plain app.Manage call, using the
 * app.Provider scaffolded into pkg/provider by addAppProvider.
 *
 * Bails out rather than guessing if main.go has already diverged from the scaffolded shape this
 * transform expects.
 */
function wireMainGo(context: Context) {
  const path = 'pkg/main.go';
  const content = context.getFile(path);

  if (!content) {
    additionsDebug(`Could not find ${path}. Skipping the app-sdk backend wiring.`);
    return;
  }

  if (content.includes('grafana-app-sdk/plugin"')) {
    additionsDebug(`${path} already wires plugin.Run. Skipping.`);
    return;
  }

  const match = content.match(APP_MANAGE_STATEMENT_REGEX);

  if (!match) {
    skip(`${path} does not match the expected app.Manage(...) call.`, [
      'Wire the grafana-app-sdk plugin.Run helper into main.go yourself:',
      'https://github.com/grafana/grafana-app-sdk/blob/main/plugin/run.go',
    ]);
    return;
  }

  const [fullStatement, pluginId, appFactory, errorBody] = match;
  const moduleMatch = content.match(/"(github\.com\/[^/]+\/[^/]+)\/pkg\/plugin"/);
  const providerImportPath = moduleMatch ? `${moduleMatch[1]}/pkg/provider` : undefined;

  if (!providerImportPath) {
    skip(`${path} does not import its own pkg/plugin package under a recognisable module path.`, [
      'Wire the grafana-app-sdk plugin.Run helper into main.go yourself:',
      'https://github.com/grafana/grafana-app-sdk/blob/main/plugin/run.go',
    ]);
    return;
  }

  const updated = content
    .replace(
      '\t"github.com/grafana/grafana-plugin-sdk-go/backend/app"\n\t"github.com/grafana/grafana-plugin-sdk-go/backend/log"',
      '\tsdkplugin "github.com/grafana/grafana-app-sdk/plugin"\n' + '\t"github.com/grafana/grafana-plugin-sdk-go/backend/log"'
    )
    .replace(
      `"${moduleMatch![1]}/pkg/plugin"`,
      `"${providerImportPath}"\n\t"${moduleMatch![1]}/pkg/plugin"`
    )
    .replace(
      fullStatement,
      `if err := sdkplugin.Run(
		provider.New(),
		sdkplugin.WithPluginID(${pluginId}),
		sdkplugin.WithAppFunc(${appFactory}),
	); err != nil {
${errorBody}\t}`
    );

  context.updateFile(path, updated);
}

/** Tells the user what to run next. */
function printNextSteps(hasGoBackend: boolean) {
  output.log({
    title: 'Added grafana-app-sdk code generation. Next steps:',
    body: [
      'Edit your kinds in ./kinds (start with kinds/example.cue), then run:',
      '  npm run generate:kinds',
      ...(hasGoBackend
        ? [
            // provider.go imports the packages generate:kinds writes to pkg/generated/, so `go mod
            // tidy` (which resolves the grafana-app-sdk dependency added to go.mod) must run after —
            // running it first fails, since it can't find those not-yet-generated packages locally.
            'Then, to resolve the grafana-app-sdk dependency added to go.mod, run:',
            '  go mod tidy',
          ]
        : []),
      'See ./kinds/README.md for the full workflow.',
    ],
  });
}
