import glob from 'glob';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import { filterOutCommonFiles, isFile, isFileStartingWith } from './utils.files';
import { renderHandlebarsTemplate } from './utils.handlebars';
import { getPluginJson } from './utils.plugin';
import { TEMPLATE_PATHS, EXPORT_PATH_PREFIX, EXTRA_TEMPLATE_VARIABLES } from '../constants';
import { getPackageManagerWithFallback } from './utils.packageManager';
import { getExportFileName } from '../utils/utils.files';
import { getVersion } from './utils.version';
import { getConfig } from './utils.config';

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

export function renderTemplateFromFile(templateFile: string, data?: any) {
  return renderHandlebarsTemplate(fs.readFileSync(templateFile).toString(), data);
}

export function getTemplateData() {
  const pluginJson = getPluginJson();
  const { features } = getConfig();
  const currentVersion = getVersion();

  const { packageManagerName, packageManagerVersion } = getPackageManagerWithFallback();

  return {
    ...EXTRA_TEMPLATE_VARIABLES,
    pluginId: pluginJson.id,
    pluginName: pluginJson.name,
    pluginDescription: pluginJson.info?.description,
    hasBackend: Boolean(pluginJson.backend),
    orgName: pluginJson.info?.author?.name,
    pluginType: pluginJson.type,
    packageManagerName,
    packageManagerVersion,
    version: currentVersion,
    bundleGrafanaUI: features.bundleGrafanaUI,
  };
}
