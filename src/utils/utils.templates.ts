import glob from 'glob';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import { filterOutCommonFiles, isFile } from './utils.files';
import { renderHandlebarsTemplate } from './utils.handlebars';
import { TEMPLATE_PATHS, EXPORT_PATH_PREFIX } from '../constants';

/**
 *
 * @param pluginType - The type of the plugin to get template files for (plugin-specific templates override the common ones)
 * @param subDirectory - You can look for template files under a certain subdirectory under the templates/common/ or templates/<PLUGIN_TYPE>/ folders.
 */
export function getTemplateFiles(pluginType: string, subDirectory?: string): string[] {
  const commonPath = subDirectory ? path.join(TEMPLATE_PATHS.common, subDirectory) : TEMPLATE_PATHS.common;
  const pluginTypeSpecificPath = subDirectory
    ? path.join(TEMPLATE_PATHS[pluginType], subDirectory)
    : TEMPLATE_PATHS[pluginType];

  const commonFiles = glob.sync(`${commonPath}/**`, { dot: true });
  const pluginTypeSpecificFiles = glob.sync(`${pluginTypeSpecificPath}/**`, { dot: true });

  return filterOutCommonFiles([...commonFiles, ...pluginTypeSpecificFiles], pluginType);
}

export function renderTemplateFromFile(templateFile: string, data?: any) {
  return renderHandlebarsTemplate(fs.readFileSync(templateFile).toString(), data);
}

export function renderAndCopyTemplateFile(pluginType: string, templateFile: string, data?: any) {
  if (!isFile(templateFile)) {
    return;
  }

  const rendered = renderTemplateFromFile(templateFile, data);
  const relativeExportPath = templateFile.replace(TEMPLATE_PATHS.common, '').replace(TEMPLATE_PATHS[pluginType], '');
  const exportPath = path.join(EXPORT_PATH_PREFIX, relativeExportPath);

  mkdirp.sync(path.dirname(exportPath));
  fs.writeFileSync(exportPath, rendered);
}
