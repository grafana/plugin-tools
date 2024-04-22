import { glob } from 'glob';
import path from 'node:path';
import fs from 'node:fs';
import { mkdirp } from 'mkdirp';
import createDebug from 'debug';
import { filterOutCommonFiles, isFile, isFileStartingWith } from './utils.files.js';
import { renderHandlebarsTemplate } from './utils.handlebars.js';
import { getPluginJson } from './utils.plugin.js';
import {
  TEMPLATE_PATHS,
  EXPORT_PATH_PREFIX,
  EXTRA_TEMPLATE_VARIABLES,
  PLUGIN_TYPES,
  DEFAULT_FEATURE_FLAGS,
} from '../constants.js';
import { CliArgs, TemplateData } from '../types.js';
import {
  getPackageManagerInstallCmd,
  getPackageManagerWithFallback,
  getPackageManagerFromUserAgent,
} from './utils.packageManager.js';
import { getExportFileName } from '../utils/utils.files.js';
import { getVersion } from './utils.version.js';
import { getConfig } from './utils.config.js';

const debug = createDebug('templates');

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

  mkdirp.sync(path.dirname(exportPath));
  fs.writeFileSync(exportPath, rendered);
}

export function compileProvisioningTemplateFile(pluginType: string, templateFile: string, data?: any) {
  if (!isFile(templateFile)) {
    return;
  }

  const rendered = renderTemplateFromFile(templateFile, data);
  const relativeExportPath = templateFile.replace(TEMPLATE_PATHS[pluginType], '.');
  const exportPath = path.join(EXPORT_PATH_PREFIX, path.dirname(relativeExportPath), getExportFileName(templateFile));

  mkdirp.sync(path.dirname(exportPath));
  fs.writeFileSync(exportPath, rendered);
}

export function renderTemplateFromFile(templateFile: string, data?: any) {
  return renderHandlebarsTemplate(fs.readFileSync(templateFile).toString(), data);
}

export function getTemplateData(data?: Partial<TemplateData>): TemplateData {
  const { features } = getConfig();
  const currentVersion = getVersion();
  const pluginJson = data ? undefined : getPluginJson();
  const pluginType = data?.pluginType ?? pluginJson?.type;
  const packageManagerInfo = data ? getPackageManagerFromUserAgent() : getPackageManagerWithFallback();
  const packageManagerName = packageManagerInfo.packageManagerName;
  const packageManagerInstallCmd = getPackageManagerInstallCmd(packageManagerName);
  const useReactRouterV6 = features.useReactRouterV6 === true && pluginType === PLUGIN_TYPES.app;
  const usePlaywright = features.usePlaywright === true || isFile(path.join(process.cwd(), 'playwright.config.ts'));
  const githubFolder = path.join(process.cwd(), '.github', 'workflows');
  const hasGithubWorkflows = data?.hasGithubWorkflows ?? isFile(path.join(githubFolder, 'ci.yml'));
  const hasGithubLevitateWorkflow =
    data?.hasGithubLevitateWorkflow ?? isFile(path.join(githubFolder, 'is-compatible.yml'));
  const e2eTestCmd = usePlaywright
    ? 'playwright test'
    : `${packageManagerName} exec cypress install && ${packageManagerName} exec grafana-e2e run`;

  const templateData = {
    ...EXTRA_TEMPLATE_VARIABLES,
    pluginId: data?.pluginId ?? pluginJson?.id,
    pluginName: data?.pluginName ?? pluginJson?.name,
    pluginDescription: data?.pluginName ?? pluginJson?.info?.description,
    hasBackend: data?.hasBackend ?? pluginJson?.backend,
    orgName: data?.orgName ?? pluginJson?.info?.author?.name,
    pluginType,
    packageManagerName: packageManagerName,
    packageManagerInstallCmd: packageManagerInstallCmd,
    packageManagerVersion: packageManagerInfo.packageManagerVersion,
    isAppType: pluginType === PLUGIN_TYPES.app || pluginType === PLUGIN_TYPES.scenes,
    isNPM: packageManagerName === 'npm',
    version: currentVersion,
    bundleGrafanaUI: features.bundleGrafanaUI ?? DEFAULT_FEATURE_FLAGS.bundleGrafanaUI,
    useReactRouterV6,
    reactRouterVersion: useReactRouterV6 ? '6.22.0' : '5.2.0',
    usePlaywright,
    e2eTestCmd,
    hasGithubWorkflows,
    hasGithubLevitateWorkflow,
  };

  debug('\nTemplate data:\n' + JSON.stringify(templateData, null, 2));

  return templateData;
}
