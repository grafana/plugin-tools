import {
  DEFAULT_FEATURE_FLAGS,
  EXPORT_PATH_PREFIX,
  EXTRA_TEMPLATE_VARIABLES,
  PLUGIN_TYPES,
  TEMPLATE_PATHS,
} from '../constants.js';
import { GenerateCliArgs, TemplateData } from '../types.js';
import { filterOutCommonFiles, isFile, isFileStartingWith } from './utils.files.js';
import {
  getPackageManagerFromUserAgent,
  getPackageManagerInstallCmd,
  getPackageManagerWithFallback,
  type PackageManager,
} from './utils.packageManager.js';
import { normalizeId, renderHandlebarsTemplate } from './utils.handlebars.js';

import { CURRENT_APP_VERSION } from './utils.version.js';
import { debug } from './utils.cli.js';
import fs from 'node:fs';
import { type FeatureFlags, getConfig } from './utils.config.js';
import { getExportFileName } from '../utils/utils.files.js';
import { getPluginJson } from './utils.plugin.js';
import { glob } from 'glob';
import path from 'node:path';

const templatesDebugger = debug.extend('templates');

/**
 *
 * @param pluginType - The type of the plugin to get template files for (plugin-specific templates override the common ones)
 * @param filter - (Optional) A single or array of strings to filter the files by - only the files that are starting with the filter string(s) are going to be returned.
 */
export function getTemplateFiles(pluginType: string, filter?: string | string[]): string[] {
  const commonFiles = glob.sync(`${TEMPLATE_PATHS.common}/**`, { dot: true });
  const pluginTypeSpecificFiles = glob.sync(`${TEMPLATE_PATHS[pluginType]}/**`, { dot: true });
  const templateFiles = filterOutCommonFiles([...commonFiles, ...pluginTypeSpecificFiles], pluginType);

  if (filter) {
    return templateFiles.filter((file) => {
      const projectRelativePath = getProjectRelativeTemplatePath(file, pluginType);

      return isFileStartingWith(projectRelativePath, filter);
    });
  }

  return templateFiles;
}

/**
 * Returns the path of the template file that is relative to the root of the scaffolded project.
 *
 * @param file - The absolute path of the template file
 * @param pluginType - The type of the plugin
 */
export function getProjectRelativeTemplatePath(file: string, pluginType: string) {
  return file.replace(TEMPLATE_PATHS.common, '').replace(TEMPLATE_PATHS[pluginType], '').replace(/^\/+/, '');
}

export function compileTemplateFiles(filter?: string[], data?: any) {
  const { type } = getPluginJson();

  getTemplateFiles(type, filter).forEach((file) => compileSingleTemplateFile(type, file, data));
}

export function compileSingleTemplateFile(pluginType: string, templateFile: string, data?: any) {
  if (!isFile(templateFile)) {
    return;
  }

  const rendered = renderTemplateFromFile(templateFile, data);
  const relativeExportPath = templateFile.replace(TEMPLATE_PATHS.common, '').replace(TEMPLATE_PATHS[pluginType], '');
  const exportPath = path.join(EXPORT_PATH_PREFIX, path.dirname(relativeExportPath), getExportFileName(templateFile));

  fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  fs.writeFileSync(exportPath, rendered);
}

export function compileProvisioningTemplateFile(pluginType: string, templateFile: string, data?: any) {
  if (!isFile(templateFile)) {
    return;
  }

  const rendered = renderTemplateFromFile(templateFile, data);
  const relativeExportPath = templateFile.replace(TEMPLATE_PATHS[pluginType], '.');
  const exportPath = path.join(EXPORT_PATH_PREFIX, path.dirname(relativeExportPath), getExportFileName(templateFile));

  fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  fs.writeFileSync(exportPath, rendered);
}

export function renderTemplateFromFile(templateFile: string, data?: any) {
  return renderHandlebarsTemplate(fs.readFileSync(templateFile).toString(), data);
}

/**
 * Builds the template data for an existing plugin from its plugin.json, package manager and feature flags.
 * Pure, so codemods can pass in values read from their Context instead of from disk.
 */
export function buildTemplateData({
  pluginJson,
  packageManager,
  features,
}: {
  pluginJson: Record<string, any>;
  packageManager: PackageManager;
  features: FeatureFlags;
}): TemplateData {
  const { packageManagerName, packageManagerVersion } = packageManager;
  return {
    ...EXTRA_TEMPLATE_VARIABLES,
    pluginId: pluginJson.id,
    pluginName: pluginJson.name,
    hasBackend: pluginJson.backend,
    orgName: pluginJson.info?.author?.name,
    pluginType: pluginJson.type,
    packageManagerName,
    packageManagerVersion,
    packageManagerInstallCmd: getPackageManagerInstallCmd(packageManagerName, packageManagerVersion),
    isAppType: isAppType(pluginJson.type),
    isNPM: isNPM(packageManagerName),
    version: CURRENT_APP_VERSION,
    bundleGrafanaUI: features.bundleGrafanaUI ?? DEFAULT_FEATURE_FLAGS.bundleGrafanaUI,
    scenesVersion: '^8.17.0',
    pluginExecutable: pluginJson.executable,
    useRspack: Boolean(features.useRspack),
    frontendBundler: features.useRspack ? 'rspack' : 'webpack',
  };
}

function isAppType(pluginType: string) {
  return pluginType === PLUGIN_TYPES.app || pluginType === PLUGIN_TYPES.scenes;
}

function isNPM(packageManagerName: string) {
  return packageManagerName === 'npm';
}

export function getTemplateData(cliArgs?: GenerateCliArgs): TemplateData {
  const { features } = getConfig();
  const currentVersion = CURRENT_APP_VERSION;
  const bundleGrafanaUI = features.bundleGrafanaUI ?? DEFAULT_FEATURE_FLAGS.bundleGrafanaUI;
  const frontendBundler = features.useRspack ? 'rspack' : 'webpack';

  let templateData: TemplateData;

  // `cliArgs` is only passed in when scaffolding a new plugin via the CLI (generate command)
  if (cliArgs) {
    const { packageManagerName, packageManagerVersion } = getPackageManagerFromUserAgent();

    templateData = {
      ...EXTRA_TEMPLATE_VARIABLES,
      pluginId: normalizeId(cliArgs.pluginName, cliArgs.orgName, cliArgs.pluginType),
      pluginName: cliArgs.pluginName,
      // check plugintype and hasBackend as they can both be passed via user input (cli args).
      hasBackend: cliArgs.pluginType !== PLUGIN_TYPES.panel && cliArgs.hasBackend,
      orgName: cliArgs.orgName,
      pluginType: cliArgs.pluginType,
      packageManagerName,
      packageManagerVersion,
      packageManagerInstallCmd: getPackageManagerInstallCmd(packageManagerName, packageManagerVersion),
      isAppType: isAppType(cliArgs.pluginType),
      isNPM: isNPM(packageManagerName),
      version: currentVersion,
      bundleGrafanaUI,
      scenesVersion: '^8.17.0',
      useRspack: Boolean(features.useRspack),
      frontendBundler,
    };
    // Updating or migrating a plugin
    // (plugin.json and package.json files are only present if it's an existing plugin)
  } else {
    templateData = buildTemplateData({
      pluginJson: getPluginJson(),
      packageManager: getPackageManagerWithFallback(),
      features,
    });
  }

  templatesDebugger('\nTemplate data:\n' + JSON.stringify(templateData, null, 2));

  return templateData;
}
