import { lt as semverLt } from 'semver';
import { glob } from 'glob';
import path from 'node:path';
import fs from 'node:fs';
import createDebug from 'debug';
import { filterOutCommonFiles, isFile, isFileStartingWith } from './utils.files.js';
import { normalizeId, renderHandlebarsTemplate } from './utils.handlebars.js';
import { getPluginJson } from './utils.plugin.js';
import {
  TEMPLATE_PATHS,
  EXPORT_PATH_PREFIX,
  EXTRA_TEMPLATE_VARIABLES,
  PLUGIN_TYPES,
  DEFAULT_FEATURE_FLAGS,
} from '../constants.js';
import { GenerateCliArgs, TemplateData } from '../types.js';
import {
  getPackageManagerInstallCmd,
  getPackageManagerWithFallback,
  getPackageManagerFromUserAgent,
} from './utils.packageManager.js';
import { getExportFileName } from '../utils/utils.files.js';
import { getGrafanaRuntimeVersion, getVersion } from './utils.version.js';
import { getConfig } from './utils.config.js';

const debug = createDebug('create-plugin:templates');

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

export function getTemplateData(cliArgs?: GenerateCliArgs): TemplateData {
  const { features } = getConfig();
  const currentVersion = getVersion();
  const grafanaVersion = getGrafanaRuntimeVersion();
  const usePlaywright = features.usePlaywright === true || isFile(path.join(process.cwd(), 'playwright.config.ts'));
  //@grafana/e2e was deprecated in Grafana 11
  const useCypress =
    !usePlaywright && semverLt(grafanaVersion, '11.0.0') && fs.existsSync(path.join(process.cwd(), 'cypress'));
  const bundleGrafanaUI = features.bundleGrafanaUI ?? DEFAULT_FEATURE_FLAGS.bundleGrafanaUI;
  const shouldUseReactRouterV6 = () => features.useReactRouterV6 === true;
  const getReactRouterVersion = () => (shouldUseReactRouterV6() ? '6.22.0' : '5.2.0');
  const isAppType = (pluginType: string) => pluginType === PLUGIN_TYPES.app || pluginType === PLUGIN_TYPES.scenes;
  const isNPM = (packageManagerName: string) => packageManagerName === 'npm';

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
      useReactRouterV6: shouldUseReactRouterV6(),
      reactRouterVersion: getReactRouterVersion(),
      usePlaywright,
      useCypress,
    };
    // Updating or migrating a plugin
    // (plugin.json and package.json files are only present if it's an existing plugin)
  } else {
    const pluginJson = getPluginJson();
    const { packageManagerName, packageManagerVersion } = getPackageManagerWithFallback();

    templateData = {
      ...EXTRA_TEMPLATE_VARIABLES,
      pluginId: pluginJson.id,
      pluginName: pluginJson.name,
      hasBackend: pluginJson.backend,
      orgName: pluginJson.info.author.name,
      pluginType: pluginJson.type,
      packageManagerName: packageManagerName,
      packageManagerVersion: packageManagerVersion,
      packageManagerInstallCmd: getPackageManagerInstallCmd(packageManagerName, packageManagerVersion),
      isAppType: isAppType(pluginJson.type),
      isNPM: isNPM(packageManagerName),
      version: currentVersion,
      bundleGrafanaUI,
      useReactRouterV6: shouldUseReactRouterV6(),
      reactRouterVersion: getReactRouterVersion(),
      usePlaywright,
      useCypress,
      pluginExecutable: pluginJson.executable,
    };
  }

  debug('\nTemplate data:\n' + JSON.stringify(templateData, null, 2));

  return templateData;
}
