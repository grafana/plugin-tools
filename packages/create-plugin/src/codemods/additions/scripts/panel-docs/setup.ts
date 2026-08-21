import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from '../../../context.js';
import { output } from '../../../../utils/utils.console.js';
import { additionsDebug, addDependenciesToPackageJson, isVersionGreater } from '../../../utils.js';

const REQUIRED_BUILD_PLUGIN_REF = 'build-plugin/v1.2.0';

export interface PluginJson {
  type?: string;
  name?: string;
  docsPath?: string;
  [key: string]: unknown;
}

export interface DocsSetupOptions {
  context: Context;
  docsPath: string;
  templateBaseUrl: URL;
  codemodName: string;
}

export function setupDocsScaffolding(opts: DocsSetupOptions): Context {
  const { context, docsPath, templateBaseUrl, codemodName } = opts;

  // step 1: early exit if the docs directory already exists on disk
  if (existsSync(join(context.basePath, docsPath))) {
    throw new Error(
      `A directory already exists at '${docsPath}'. Re-run with a different path:\n  create-plugin add ${codemodName} --docsPath <alternative-path>`
    );
  }

  // step 2: set docsPath in src/plugin.json
  const pluginJson = readPluginJson(context);

  const existingDocsPath = pluginJson.docsPath;
  if (existingDocsPath !== undefined && existingDocsPath !== docsPath) {
    throw new Error(
      `src/plugin.json already has docsPath set to '${existingDocsPath}'.\n  Re-run with the existing path:\n  create-plugin add ${codemodName} --docsPath ${existingDocsPath}`
    );
  }
  context.updateFile('src/plugin.json', JSON.stringify({ ...pluginJson, docsPath }, null, 2));

  const pluginName = pluginJson.name ?? 'my-plugin';

  // step 3: add @grafana/plugin-docs-cli as a devDependency
  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': '^0.2.1' });

  // step 4: add docs:serve and docs:validate npm scripts
  addDocsScripts(context);

  // step 5: copy template files to docs folder (includes README.md)
  copyDocsTemplates(context, templateBaseUrl, docsPath, pluginName);

  // step 6: copy validate-docs workflow, unless the user already customized one
  const workflowPath = '.github/workflows/validate-docs.yml';
  if (!context.doesFileExist(workflowPath)) {
    const workflowContent = readTemplate(templateBaseUrl, 'workflows/validate-docs.yml').replaceAll(
      '{{docsPath}}',
      docsPath
    );
    context.addFile(workflowPath, workflowContent);
  } else {
    additionsDebug(`${workflowPath} already exists, skipping`);
  }

  // step 7: bump build-plugin version in release.yml
  bumpBuildPluginVersion(context);

  // step 8: print next-steps summary
  printNextSteps(docsPath);

  return context;
}

function printNextSteps(docsPath: string): void {
  output.log({
    title: 'Next steps',
    body: [
      `Fill in the stub docs under ${docsPath}/ with your plugin's actual content`,
      'Run `npm run docs:serve` to preview the docs locally',
      'Run `npm run docs:validate` to check for issues before pushing',
    ],
  });
}

// reads and parses src/plugin.json, throwing a helpful error if it's missing,
// unparseable, or not a plain object (e.g. `null`, an array, a bare string -
// all valid JSON, none of them a usable plugin.json).
function readPluginJson(context: Context): PluginJson {
  const raw = context.getFile('src/plugin.json');
  if (raw === undefined) {
    throw new Error('Cannot find src/plugin.json. Run this command from the plugin root directory.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Cannot parse src/plugin.json: ${e}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('src/plugin.json does not contain a JSON object.');
  }
  return parsed as PluginJson;
}

// verifies plugin.json's `type` matches the expected value. Throws a helpful
// error otherwise.
export function assertPluginType(
  context: Context,
  opts: { expectedType: 'datasource' | 'panel'; codemodName: string }
): PluginJson {
  const parsed = readPluginJson(context);
  if (parsed.type !== opts.expectedType) {
    const otherCommand = opts.expectedType === 'datasource' ? 'panel-docs' : 'datasource-docs';
    throw new Error(
      `create-plugin add ${opts.codemodName} only works on '${opts.expectedType}' plugins, but this plugin's type is '${parsed.type ?? 'unset'}'. Try create-plugin add ${otherCommand} if this is the other plugin type.`
    );
  }
  return parsed;
}

function copyDocsTemplates(context: Context, templateBaseUrl: URL, docsPath: string, pluginName: string): void {
  const docsTemplateDir = fileURLToPath(new URL('./docs', templateBaseUrl));
  if (!existsSync(docsTemplateDir)) {
    throw new Error(
      `Cannot find docs templates at ${docsTemplateDir}. This is a bug in @grafana/create-plugin - please report it.`
    );
  }
  for (const filePath of listFilesRecursively(docsTemplateDir)) {
    const relativePath = filePath.slice(docsTemplateDir.length + 1);
    const targetPath = `${docsPath}/${relativePath}`;
    if (!context.doesFileExist(targetPath)) {
      const content = readFileSync(filePath, 'utf-8').replaceAll('{{pluginName}}', pluginName);
      context.addFile(targetPath, content);
    } else {
      additionsDebug(`${targetPath} already exists, skipping`);
    }
  }
}

function listFilesRecursively(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    return entry.isDirectory() ? listFilesRecursively(fullPath) : [fullPath];
  });
}

function readTemplate(templateBaseUrl: URL, relativePath: string): string {
  const templatePath = fileURLToPath(new URL(relativePath, templateBaseUrl));
  return readFileSync(templatePath, 'utf-8');
}

// matches an anchored `uses: grafana/plugin-actions/build-plugin@<ref>` line,
// capturing the prefix (for reassembly) and the existing ref (to compare
// versions before overwriting it).
const BUILD_PLUGIN_USES_RE = /(uses:\s*grafana\/plugin-actions\/build-plugin@)([^\s'"]+)/g;
// matches the version out of either a bare `vX.Y.Z` tag or a `build-plugin/vX.Y.Z`
// tag - the two ref shapes this codemod and its templates actually use.
const BUILD_PLUGIN_TAG_RE = /^(?:build-plugin\/)?v(\d+\.\d+\.\d+)$/;

function bumpBuildPluginVersion(context: Context): void {
  const releaseYmlContent = context.getFile('.github/workflows/release.yml');
  if (!releaseYmlContent) {
    additionsDebug('no .github/workflows/release.yml found, skipping build-plugin version bump');
    return;
  }

  let matched = false;
  const requiredVersion = BUILD_PLUGIN_TAG_RE.exec(REQUIRED_BUILD_PLUGIN_REF)?.[1];
  const updated = releaseYmlContent.replace(BUILD_PLUGIN_USES_RE, (fullMatch, prefix: string, existingRef: string) => {
    matched = true;
    const existingVersion = BUILD_PLUGIN_TAG_RE.exec(existingRef)?.[1];
    // only skip the bump when both refs parse as versions and the existing one
    // is already at least as new - an unparseable ref (a branch, a SHA) always
    // gets normalized to the required tag.
    if (existingVersion && requiredVersion && !isVersionGreater(requiredVersion, existingVersion, false)) {
      additionsDebug(
        `release.yml already pins build-plugin@${existingRef}, which is not older than ${REQUIRED_BUILD_PLUGIN_REF}, skipping`
      );
      return fullMatch;
    }
    return `${prefix}${REQUIRED_BUILD_PLUGIN_REF}`;
  });

  if (!matched) {
    additionsDebug('no grafana/plugin-actions/build-plugin reference found in release.yml, skipping');
    return;
  }
  if (updated === releaseYmlContent) {
    additionsDebug('release.yml build-plugin reference(s) already up to date, skipping');
    return;
  }
  context.updateFile('.github/workflows/release.yml', updated);
}

function addDocsScripts(context: Context): void {
  const packageJsonContent = context.getFile('package.json');
  if (!packageJsonContent) {
    return;
  }
  let packageJson: Record<string, unknown>;
  try {
    packageJson = JSON.parse(packageJsonContent);
  } catch (e) {
    throw new Error(`Cannot parse package.json: ${e}`);
  }
  const scripts = (packageJson['scripts'] ?? {}) as Record<string, string>;
  let changed = false;

  if (!scripts['docs:serve']) {
    scripts['docs:serve'] = 'plugin-docs-cli serve --port 3001 --reload';
    changed = true;
  } else {
    additionsDebug('docs:serve already exists in package.json scripts, skipping');
  }

  if (!scripts['docs:validate']) {
    scripts['docs:validate'] = 'plugin-docs-cli validate --strict';
    changed = true;
  } else {
    additionsDebug('docs:validate already exists in package.json scripts, skipping');
  }

  if (changed) {
    context.updateFile('package.json', JSON.stringify({ ...packageJson, scripts }, null, 2));
  }
}
