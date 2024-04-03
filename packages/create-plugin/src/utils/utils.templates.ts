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
import { get } from 'node:http';

const debug = createDebug('templates');

export const normalizeId = (pluginName: string, orgName: string, type: PLUGIN_TYPES) => {
  const re = new RegExp(`-?${type}$`, 'i');
  const nameRegex = new RegExp('[^0-9a-zA-Z]', 'g');

  const newPluginName = pluginName.replace(re, '').replace(nameRegex, '');
  const newOrgName = orgName.replace(nameRegex, '');
  return newOrgName.toLowerCase() + '-' + newPluginName.toLowerCase() + `-${type}`;
};

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

// export function buildProxyFromJson() {
//   const pluginJson = getPluginJson();
//   return new Proxy(pluginJson, {
//     get(target, prop: string | symbol) {
//       if (prop === 'pluginId') {
//         return target.id;
//       } else if (prop === 'pluginName') {
//         return target.name;
//       } else if (prop === 'pluginDescription') {
//         return target.info?.description;
//       } else if (prop === 'hasBackend') {
//         return target.backend;
//       } else if (prop === 'hasGithubWorkflows') {
//         return undefined;
//       } else if (prop === 'hasGithubLevitateWorkflow') {
//         return undefined;
//       } else if (prop === 'orgName') {
//         return target.info?.author?.name;
//       } else if (prop === 'pluginType') {
//         return target.type;
//       } else if (prop === 'packageManager') {
//         return getPackageManagerWithFallback();
//       } else {
//         throw new Error(`Property ${String(prop)} not found in package.json.`);
//       }
//     },
//   });
// }
// export function buildProxyFromUserPrompt(target: CliArgs) {
//   return new Proxy(target, {
//     get(target: CliArgs, prop: string | symbol) {
//       if (prop in target) {
//         return target[prop as keyof CliArgs];
//       } else if (prop === 'pluginId') {
//         return normalizeId(target.pluginName, target.orgName, target.pluginType);
//       } else if (prop === 'packageManager') {
//         return getPackageManagerFromUserAgent();
//       } else if (prop === 'hasBackend') {
//         return target.hasOwnProperty('hasBackend') && target.hasBackend;
//       } else {
//         throw new Error(`Property ${String(prop)} not found in user's prompt.`);
//       }
//     },
//   });
// }

export function getTemplateData(data?: CliArgs): TemplateData {
  const { features } = getConfig();
  const currentVersion = getVersion();

  let templateData: TemplateData;
  if (data) {
    const { packageManagerName, packageManagerVersion } = getPackageManagerFromUserAgent();
    const packageManagerInstallCmd = getPackageManagerInstallCmd(packageManagerName);
    const useReactRouterV6 = features.useReactRouterV6 === true && data.pluginType === PLUGIN_TYPES.app;
    templateData = {
      ...EXTRA_TEMPLATE_VARIABLES,
      ...data,
      pluginId: normalizeId(data.pluginName, data.orgName, data.pluginType),
      packageManagerName,
      packageManagerInstallCmd,
      packageManagerVersion,
      isAppType: data.pluginType === PLUGIN_TYPES.app || data.pluginType === PLUGIN_TYPES.scenes,
      isNPM: packageManagerName === 'npm',
      version: currentVersion,
      bundleGrafanaUI: features.bundleGrafanaUI ?? DEFAULT_FEATURE_FLAGS.bundleGrafanaUI,
      useReactRouterV6,
      reactRouterVersion: useReactRouterV6 ? '6.22.0' : '5.2.0',
    };
  } else {
    const pluginJson = getPluginJson();
    const { packageManagerName, packageManagerVersion } = getPackageManagerWithFallback();
    const packageManagerInstallCmd = getPackageManagerInstallCmd(packageManagerName);
    const useReactRouterV6 = features.useReactRouterV6 === true && pluginJson.type === PLUGIN_TYPES.app;
    templateData = {
      ...EXTRA_TEMPLATE_VARIABLES,
      pluginId: pluginJson.id,
      pluginName: pluginJson.name,
      pluginDescription: pluginJson.info?.description,
      hasBackend: pluginJson.backend,
      orgName: pluginJson.info?.author?.name,
      pluginType: pluginJson.type,
      packageManagerName,
      packageManagerInstallCmd,
      packageManagerVersion,
      isAppType: pluginJson.type === PLUGIN_TYPES.app || pluginJson.type === PLUGIN_TYPES.scenes,
      isNPM: packageManagerName === 'npm',
      version: currentVersion,
      bundleGrafanaUI: features.bundleGrafanaUI ?? DEFAULT_FEATURE_FLAGS.bundleGrafanaUI,
      useReactRouterV6,
      reactRouterVersion: useReactRouterV6 ? '6.22.0' : '5.2.0',
    };
  }

  debug('\nTemplate data:\n' + JSON.stringify(templateData, null, 2));
  return templateData;
}
