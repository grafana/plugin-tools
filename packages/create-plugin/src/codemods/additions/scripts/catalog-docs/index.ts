import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from '../../../context.js';
import { additionsDebug, addDependenciesToPackageJson } from '../../../utils.js';
import { type CatalogDocsOptions, schema } from './schema.js';

export { schema };

// TODO: replace with stable tag once plugin-actions PR #219 merges
const REQUIRED_BUILD_PLUGIN_REF = 'eriksundell/plugin-docs-build-step';

interface PluginJson {
  type?: string;
  name?: string;
  docsPath?: string;
  [key: string]: unknown;
}

export default function catalogDocs(context: Context, options: CatalogDocsOptions): Context {
  const { docsPath } = options;

  // step 1: early exit if the docs directory already exists on disk
  if (existsSync(join(context.basePath, docsPath))) {
    throw new Error(
      `A directory already exists at '${docsPath}'. Re-run with a different path:\n  create-plugin add catalog-docs --docsPath <alternative-path>`
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

  // extract type and name for use in later steps
  const pluginType = pluginJson.type ?? 'app';
  const pluginName = pluginJson.name ?? 'my-plugin';

  // step 3: add @grafana/plugin-docs-cli as a devDependency
  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': '^0.0.10' });

  // step 4: add docs:serve and docs:validate npm scripts
  addDocsScripts(context);

  // step 5: copy template files to docs folder
  copyDocsTemplates(context, pluginType, docsPath, pluginName);

  // step 6: copy validate-docs workflow
  upsertFile(context, '.github/workflows/validate-docs.yml', readTemplateFile('workflows/validate-docs.yml'));

  // step 7: bump build-plugin version in release.yml
  bumpBuildPluginVersion(context);

  return context;
}

function copyDocsTemplates(context: Context, pluginType: string, docsPath: string, pluginName: string): void {
  const templateFolderType = pluginType === 'scenesapp' ? 'app' : pluginType;
  for (const typeFolder of ['common', templateFolderType]) {
    const templateDir = fileURLToPath(new URL(`./templates/${typeFolder}/docs`, import.meta.url));
    if (!existsSync(templateDir)) {
      continue;
    }
    for (const filePath of listFilesRecursively(templateDir)) {
      const relativePath = filePath.slice(templateDir.length + 1);
      const targetPath = `${docsPath}/${relativePath}`;
      if (!context.doesFileExist(targetPath)) {
        const content = readFileSync(filePath, 'utf-8').replaceAll('{{pluginName}}', pluginName);
        context.addFile(targetPath, content);
      } else {
        additionsDebug(`${targetPath} already exists, skipping`);
      }
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

function readTemplateFile(relativePath: string): string {
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
