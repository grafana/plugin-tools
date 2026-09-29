import { fileURLToPath } from 'node:url';
import { lt, major, minVersion, validRange } from 'semver';
import type { Context } from '../../context.js';
import {
  additionsDebug,
  addDependenciesToPackageJson,
  readJsonFile,
  removeDependenciesFromPackageJson,
  renderTemplate,
} from '../../utils.js';

const RSPACK_TEMPLATE_DATA_OVERRIDES = {
  useExperimentalRspack: true,
  frontendBundler: 'rspack',
};

const WEBPACK_TEMPLATE_DATA_OVERRIDES = {
  useExperimentalRspack: false,
  frontendBundler: 'webpack',
};

const RSPACK_CONFIG_FILES = [
  '.config/rspack/rspack.config.ts',
  '.config/rspack/BuildModeRspackPlugin.ts',
  '.config/rspack/liveReloadPlugin.ts',
];

const BUNDLER_FILES = [
  '.config/bundler/constants.ts',
  '.config/bundler/copyFiles.ts',
  '.config/bundler/externals.ts',
  '.config/bundler/utils.ts',
];

const WEBPACK_CONFIG_PATH = '.config/webpack/webpack.config.ts';
const RSPACK_CONFIG_PATH = '.config/rspack/rspack.config.ts';

// every file create-plugin has scaffolded into .config/webpack over time. anything else in there
// was added by the plugin author, so it is kept and reported instead of deleted
const WEBPACK_TEMPLATE_FILES = [
  '.config/webpack/BuildModeWebpackPlugin.ts',
  '.config/webpack/PluginSchemaWebpackPlugin.ts',
  '.config/webpack/constants.ts',
  '.config/webpack/generateCode.ts',
  '.config/webpack/publicPath.ts',
  '.config/webpack/tsconfig.webpack.json',
  '.config/webpack/utils.ts',
  '.config/webpack/watchPluginJson.ts',
  '.config/webpack/webpack.config.ts',
  '.config/webpack/webpack.parts.ts',
];

export default function rspack(context: Context): Context {
  const hasWebpackSetup = context.doesFileExist(WEBPACK_CONFIG_PATH);
  const hasRspackSetup = context.doesFileExist(RSPACK_CONFIG_PATH);

  if (!hasWebpackSetup && !hasRspackSetup) {
    context.setMessage({
      level: 'warning',
      title: 'No create-plugin bundler configuration found, so nothing was changed.',
      body: [`The rspack addition expects ${WEBPACK_CONFIG_PATH} or ${RSPACK_CONFIG_PATH} to exist.`],
    });
    return context;
  }

  const followUps: string[] = [];

  renderTemplateFiles(context, RSPACK_CONFIG_FILES);
  renderTemplateFiles(context, BUNDLER_FILES);
  updateCprcConfig(context);

  followUps.push(...addRootRspackConfigStub(context));
  followUps.push(...updatePackageJson(context));
  followUps.push(...deleteWebpackTemplateFiles(context));
  reportFollowUps(context, followUps);

  return context;
}

function reportFollowUps(context: Context, followUps: string[]): void {
  if (followUps.length === 0) {
    return;
  }

  context.setMessage({
    level: 'warning',
    title: 'The rspack addition left some things for you to review.',
    body: followUps,
  });
}

function updateCprcConfig(context: Context): void {
  const cprcPath = '.config/.cprc.json';
  if (context.doesFileExist(cprcPath)) {
    const config = readJsonFile(context, cprcPath);

    const updated = {
      ...config,
      features: {
        ...config.features,
        useExperimentalRspack: true,
      },
    };

    context.updateFile(cprcPath, JSON.stringify(updated, null, 2));
  }
}

const resolveTemplatePath = (relativePath: string) =>
  fileURLToPath(new URL(`../../../../templates/common/${relativePath}`, import.meta.url));

// updateFile is a no-op for identical content, so re-rendering on every run keeps the addition idempotent
function renderTemplateFiles(context: Context, filePaths: string[]): void {
  for (const filePath of filePaths) {
    const rendered = renderTemplate(resolveTemplatePath(filePath), true, RSPACK_TEMPLATE_DATA_OVERRIDES);
    if (context.doesFileExist(filePath)) {
      context.updateFile(filePath, rendered);
    } else {
      context.addFile(filePath, rendered);
    }
  }
}

const ROOT_CONFIG_EXTENSIONS = ['ts', 'js', 'cjs', 'mjs', 'cts', 'mts'];

// a root webpack config means the plugin extends the build. the stub makes the build fail loudly
// until that config is ported, so a plugin cannot ship without the build features it relies on
function addRootRspackConfigStub(context: Context): string[] {
  const rootWebpackConfig = ROOT_CONFIG_EXTENSIONS.map((extension) => `webpack.config.${extension}`).find((filePath) =>
    context.doesFileExist(filePath)
  );
  if (!rootWebpackConfig) {
    return [];
  }

  const existingRootRspackConfig = ROOT_CONFIG_EXTENSIONS.map((extension) => `rspack.config.${extension}`).find(
    (filePath) => context.doesFileExist(filePath)
  );
  if (existingRootRspackConfig) {
    return [
      `${existingRootRspackConfig} already exists, so it was left as is. Check that it includes everything from ${rootWebpackConfig}.`,
    ];
  }

  additionsDebug(`Custom ${rootWebpackConfig} detected. Adding a rspack.config.ts stub that fails until it is ported.`);
  context.addFile('rspack.config.ts', getRootRspackConfigStub(rootWebpackConfig));

  return [
    `rspack.config.ts was added and fails the build until the customisations in ${rootWebpackConfig} are ported to it.`,
  ];
}

interface PackageJson {
  scripts?: Record<string, string>;
  engines?: Record<string, string>;
  [key: string]: unknown;
}

function updatePackageJson(context: Context): string[] {
  if (!context.doesFileExist('package.json')) {
    additionsDebug('No package.json found. Skipping dependency and script updates.');
    return [];
  }

  const followUps: string[] = [];
  const { rspackOnlyDevDependencies, webpackOnlyDevDependencies } = getBundlerDevDependencies();
  const userBuildFileSources = readUserBuildFileSources(context);
  const stillUsedDevDependencies = webpackOnlyDevDependencies.filter((name) =>
    userBuildFileSources.some((source) => referencesPackage(source, name))
  );
  const unusedDevDependencies = webpackOnlyDevDependencies.filter((name) => !stillUsedDevDependencies.includes(name));

  addDependenciesToPackageJson(context, {}, rspackOnlyDevDependencies);
  removeDependenciesFromPackageJson(context, [], unusedDevDependencies);

  if (stillUsedDevDependencies.length > 0) {
    followUps.push(
      'These webpack packages were kept because your root build config still uses them. Remove them once the config is ported to rspack:',
      ...stillUsedDevDependencies.map((name) => `  ${name}`)
    );
  }

  const packageJson = readJsonFile<PackageJson>(context, 'package.json');
  const { scripts, unparsedScripts } = rewriteWebpackScripts(packageJson.scripts ?? {});

  if (packageJson.scripts) {
    context.updateFile('package.json', JSON.stringify({ ...packageJson, scripts }, null, 2));
  }

  raiseNodeEngine(context);
  dropLockedRspackOnePackages(context);

  if (unparsedScripts.length > 0) {
    followUps.push(
      'These scripts still call webpack in a way the addition could not rewrite. Change them to call rspack with ./rspack.config.ts or ./.config/rspack/rspack.config.ts:',
      ...unparsedScripts.map(([name, command]) => `  ${name}: ${command}`)
    );
  }

  return followUps;
}

// rspack 2 needs Node 22.12. 22.23 also has type stripping on by default, so the rspack CLI can
// always load TypeScript configs natively. matches the engines range create-plugin scaffolds
const MIN_NODE_VERSION = '22.23.0';

function raiseNodeEngine(context: Context): void {
  const packageJson = readJsonFile<PackageJson>(context, 'package.json');
  const nodeRange = packageJson.engines?.node;
  if (!nodeRange || !validRange(nodeRange)) {
    return;
  }

  const lowestAllowedVersion = minVersion(nodeRange);
  if (!lowestAllowedVersion || !lt(lowestAllowedVersion, MIN_NODE_VERSION)) {
    return;
  }

  const engines = { ...packageJson.engines, node: '>=22.23' };
  context.updateFile('package.json', JSON.stringify({ ...packageJson, engines }, null, 2));
}

// npm refuses to move @rspack/cli and @rspack/core from 1 to 2 in one install while the lockfile
// still pins the old versions (ERESOLVE). dropping the locked @rspack packages lets npm resolve
// them again from package.json. pnpm and yarn upgrade them without help
const LOCKED_RSPACK_PACKAGE_PATTERN = /(^|\/)node_modules\/@rspack\//;

function dropLockedRspackOnePackages(context: Context): void {
  if (!context.doesFileExist('package-lock.json')) {
    return;
  }

  const lockfile = readJsonFile<{ packages?: Record<string, { version?: string }> }>(context, 'package-lock.json');
  const lockedCoreVersion = lockfile.packages?.['node_modules/@rspack/core']?.version;
  if (!lockfile.packages || !lockedCoreVersion || major(lockedCoreVersion) >= 2) {
    return;
  }

  const packages = Object.fromEntries(
    Object.entries(lockfile.packages).filter(([path]) => !LOCKED_RSPACK_PACKAGE_PATTERN.test(path))
  );
  context.updateFile('package-lock.json', JSON.stringify({ ...lockfile, packages }, null, 2) + '\n');
}

// a webpack or webpack-cli command at the start of a script, after a shell separator, after env
// assignments or after npx. the lookbehind keeps the separator and prefixes out of the match
const WEBPACK_COMMAND_PATTERN = /(?<=(?:^|&&|\|\||;|\|)\s*(?:\w+=\S*\s+)*(?:npx\s+)?)webpack(?:-cli)?(?=\s|$)/g;
const ROOT_WEBPACK_CONFIG_ARG_PATTERN =
  /((?:^|\s)(?:-c|--config)(?:\s+|=))(?:\.\/)?webpack\.config\.[cm]?[jt]s(?=\s|$)/g;
const TEMPLATE_WEBPACK_CONFIG_ARG_PATTERN =
  /((?:^|\s)(?:-c|--config)(?:\s+|=))(?:\.\/)?\.config\/webpack\/webpack\.config\.ts(?=\s|$)/g;
// anything that still runs webpack after the rewrite, e.g. node_modules/webpack-cli/bin/cli.js
const REMAINING_WEBPACK_PATTERN = /(?:^|[\s/])webpack(?:-cli)?(?:[\s/]|$)|\.config\/webpack\//;

function rewriteWebpackScripts(scripts: Record<string, string>) {
  const unparsedScripts: Array<[string, string]> = [];
  const rewrittenScripts = Object.fromEntries(
    Object.entries(scripts).map(([name, command]) => {
      const rewritten = command
        .replace(WEBPACK_COMMAND_PATTERN, 'rspack')
        .replace(ROOT_WEBPACK_CONFIG_ARG_PATTERN, '$1./rspack.config.ts')
        .replace(TEMPLATE_WEBPACK_CONFIG_ARG_PATTERN, '$1./.config/rspack/rspack.config.ts');

      if (REMAINING_WEBPACK_PATTERN.test(rewritten)) {
        unparsedScripts.push([name, command]);
        return [name, command];
      }

      return [name, rewritten];
    })
  );

  return { scripts: rewrittenScripts, unparsedScripts };
}

// root level webpack.* and rspack.* files, e.g. webpack.config.ts and helpers like webpack.config.utils.ts
const USER_BUILD_FILE_PATTERN = /^(webpack|rspack)\.[\w.-]*\.[cm]?[jt]s$/;

function readUserBuildFileSources(context: Context): string[] {
  return context
    .readDir('.')
    .filter((filePath) => USER_BUILD_FILE_PATTERN.test(filePath))
    .map((filePath) => context.getFile(filePath) ?? '');
}

// matches the package as a module specifier or loader string: 'name', "name", `name` or 'name/subpath'
function referencesPackage(source: string, packageName: string): boolean {
  const escapedName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`['"\`]${escapedName}(/[^'"\`]*)?['"\`]`).test(source);
}

// The rspack and webpack renders of the package.json template are the source of truth for which
// dev dependencies each bundler needs, so the addition never drifts from what `generate` scaffolds
function getBundlerDevDependencies() {
  const templatePath = resolveTemplatePath('_package.json');
  const rspackDevDependencies = renderDevDependencies(templatePath, RSPACK_TEMPLATE_DATA_OVERRIDES);
  const webpackDevDependencies = renderDevDependencies(templatePath, WEBPACK_TEMPLATE_DATA_OVERRIDES);

  const rspackOnlyDevDependencies = Object.fromEntries(
    Object.entries(rspackDevDependencies).filter(([name]) => !(name in webpackDevDependencies))
  );
  const webpackOnlyDevDependencies = Object.keys(webpackDevDependencies).filter(
    (name) => !(name in rspackDevDependencies)
  );

  return { rspackOnlyDevDependencies, webpackOnlyDevDependencies };
}

function renderDevDependencies(templatePath: string, templateData: Record<string, unknown>): Record<string, string> {
  const rendered: { devDependencies?: Record<string, string> } = JSON.parse(
    renderTemplate(templatePath, false, templateData)
  );
  return rendered.devDependencies ?? {};
}

function deleteWebpackTemplateFiles(context: Context): string[] {
  for (const filePath of WEBPACK_TEMPLATE_FILES) {
    if (context.doesFileExist(filePath)) {
      context.deleteFile(filePath);
    }
  }

  const leftoverFiles = context.readDir('.config/webpack');
  if (leftoverFiles.length === 0) {
    return [];
  }

  return [
    'These files in .config/webpack were not created by create-plugin, so they were kept. Move anything you still need out of .config and port it to rspack:',
    ...leftoverFiles.map((filePath) => `  ${filePath}`),
  ];
}

function getRootRspackConfigStub(rootWebpackConfig: string): string {
  return `import type { Configuration } from '@rspack/core';
import { merge } from 'rspack-merge';

import grafanaConfig, { type Env } from './.config/rspack/rspack.config.ts';

// TODO(rspack): port the customisations in ./${rootWebpackConfig} to this file, then delete it.
// Run \`npx @grafana/create-plugin@latest add rspack --agent\` to have an AI agent do the port,
// or follow https://grafana.com/developers/plugin-tools/how-to-guides/extend-configurations
// This file is loaded as native ESM, so CommonJS globals are not available. Use import.meta.dirname,
// createRequire(import.meta.url) and .ts extensions on relative imports.
throw new Error(
  '[rspack] ${rootWebpackConfig} has not been ported to rspack.config.ts yet. ' +
    'Run \`npx @grafana/create-plugin@latest add rspack --agent\` or port it by hand, then remove this error.'
);

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  return merge(baseConfig, {});
};

export default config;
`;
}
