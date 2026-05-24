import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from '../../../context.js';
import { additionsDebug, addDependenciesToPackageJson } from '../../../utils.js';

// TODO: replace with stable tag once plugin-actions PR #219 merges
const REQUIRED_BUILD_PLUGIN_REF = 'eriksundell/plugin-docs-build-step';

export interface PluginJson {
  type?: string;
  name?: string;
  docsPath?: string;
  annotations?: boolean;
  alerting?: boolean;
  backend?: boolean;
  [key: string]: unknown;
}

export type ConditionalFilePredicate = (ctx: { pluginJson: PluginJson; basePath: string }) => boolean;

export interface DocsSetupOptions {
  context: Context;
  docsPath: string;
  templateBaseUrl: URL;
  codemodName: string;
  conditionalFiles?: Record<string, ConditionalFilePredicate>;
}

export function setupDocsScaffolding(opts: DocsSetupOptions): Context {
  const { context, docsPath, templateBaseUrl, codemodName, conditionalFiles = {} } = opts;

  // step 1: early exit if the docs directory already exists on disk
  if (existsSync(join(context.basePath, docsPath))) {
    throw new Error(
      `A directory already exists at '${docsPath}'. Re-run with a different path:\n  create-plugin add ${codemodName} --docsPath <alternative-path>`
    );
  }

  // step 2: set docsPath in src/plugin.json
  const pluginJsonContent = context.getFile('src/plugin.json');
  if (pluginJsonContent === undefined) {
    throw new Error('Cannot find src/plugin.json. Run this command from the plugin root directory.');
  }

  let pluginJson: PluginJson;
  try {
    pluginJson = JSON.parse(pluginJsonContent);
  } catch (e) {
    throw new Error(`Cannot parse src/plugin.json: ${e}`);
  }

  const existingDocsPath = pluginJson.docsPath;
  if (existingDocsPath !== undefined && existingDocsPath !== docsPath) {
    additionsDebug(`src/plugin.json already has docsPath set to '${existingDocsPath}', skipping update`);
  } else {
    context.updateFile('src/plugin.json', JSON.stringify({ ...pluginJson, docsPath }, null, 2));
  }

  const pluginName = pluginJson.name ?? 'my-plugin';

  // step 3: add @grafana/plugin-docs-cli as a devDependency
  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': '^0.0.10' });

  // step 4: add docs:serve and docs:validate npm scripts
  addDocsScripts(context);

  // step 5: copy template files to docs folder
  copyDocsTemplates(context, templateBaseUrl, docsPath, pluginName, pluginJson, conditionalFiles);

  // step 6: copy validate-docs workflow from the shared templates folder (same dir as this file)
  upsertFile(context, '.github/workflows/validate-docs.yml', readSharedTemplate('workflows/validate-docs.yml'));

  // step 7: bump build-plugin version in release.yml
  bumpBuildPluginVersion(context);

  // step 8: print next-steps summary
  console.log(`
Next steps:
  - Fill in the stub docs under ${docsPath}/ with your plugin's actual content
  - Run \`npm run docs:serve\` to preview the docs locally
  - Run \`npm run docs:validate\` to check for issues before pushing
`);

  return context;
}

// parses src/plugin.json from the context and verifies its `type` matches the
// expected value. Throws a helpful error otherwise. Returns the parsed object
// so callers don't have to reparse.
export function assertPluginType(
  context: Context,
  opts: { expectedType: 'datasource' | 'panel'; codemodName: string }
): PluginJson {
  const raw = context.getFile('src/plugin.json');
  if (raw === undefined) {
    throw new Error('Cannot find src/plugin.json. Run this command from the plugin root directory.');
  }
  let parsed: PluginJson;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Cannot parse src/plugin.json: ${e}`);
  }
  if (parsed.type !== opts.expectedType) {
    const otherCommand = opts.expectedType === 'datasource' ? 'panel-docs' : 'datasource-docs';
    throw new Error(
      `create-plugin add ${opts.codemodName} only works on '${opts.expectedType}' plugins, but this plugin's type is '${parsed.type ?? 'unset'}'. Try create-plugin add ${otherCommand} if this is the other plugin type.`
    );
  }
  return parsed;
}

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const VARIABLE_SUPPORT_RE =
  /\b(?:CustomVariableSupport|StandardVariableSupport|DataSourceVariableSupport|metricFindQuery)\b/;

// scans the plugin's src/ tree for any of the four Grafana variable-support
// hooks (CustomVariableSupport, StandardVariableSupport, DataSourceVariableSupport
// or metricFindQuery). Returns true on the first match. Returns false if src/
// doesn't exist.
export function sourceContainsVariableSupport(basePath: string): boolean {
  const srcDir = join(basePath, 'src');
  if (!existsSync(srcDir)) {
    return false;
  }
  return walkForMatch(srcDir);
}

function walkForMatch(dir: string): boolean {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (walkForMatch(fullPath)) {
        return true;
      }
      continue;
    }
    if (!SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      continue;
    }
    const content = readFileSync(fullPath, 'utf-8');
    if (VARIABLE_SUPPORT_RE.test(content)) {
      return true;
    }
  }
  return false;
}

function copyDocsTemplates(
  context: Context,
  templateBaseUrl: URL,
  docsPath: string,
  pluginName: string,
  pluginJson: PluginJson,
  conditionalFiles: Record<string, ConditionalFilePredicate>
): void {
  const docsTemplateDir = fileURLToPath(new URL('./docs', templateBaseUrl));
  if (!existsSync(docsTemplateDir)) {
    return;
  }
  for (const filePath of listFilesRecursively(docsTemplateDir)) {
    const relativePath = filePath.slice(docsTemplateDir.length + 1);
    const targetPath = `${docsPath}/${relativePath}`;
    const predicate = conditionalFiles[basename(filePath)];
    if (predicate && !predicate({ pluginJson, basePath: context.basePath })) {
      additionsDebug(`${targetPath} skipped: plugin does not meet the conditions for this file`);
      continue;
    }
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

function upsertFile(context: Context, path: string, content: string): void {
  if (context.doesFileExist(path)) {
    context.updateFile(path, content);
  } else {
    context.addFile(path, content);
  }
}

function readSharedTemplate(relativePath: string): string {
  const templatePath = fileURLToPath(new URL(`./templates/${relativePath}`, import.meta.url));
  return readFileSync(templatePath, 'utf-8');
}

function bumpBuildPluginVersion(context: Context): void {
  const releaseYmlContent = context.getFile('.github/workflows/release.yml');
  if (!releaseYmlContent) {
    additionsDebug('no .github/workflows/release.yml found, skipping build-plugin version bump');
    return;
  }
  const updated = releaseYmlContent.replace(
    /(grafana\/plugin-actions\/build-plugin@)[^\s'"]+/g,
    `$1${REQUIRED_BUILD_PLUGIN_REF}`
  );
  if (updated === releaseYmlContent) {
    additionsDebug('no grafana/plugin-actions/build-plugin reference found in release.yml, skipping');
    return;
  }
  context.updateFile('.github/workflows/release.yml', updated);
}

function addDocsScripts(context: Context): void {
  const packageJsonContent = context.getFile('package.json');
  if (!packageJsonContent) {
    return;
  }
  const packageJson = JSON.parse(packageJsonContent) as Record<string, unknown>;
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
