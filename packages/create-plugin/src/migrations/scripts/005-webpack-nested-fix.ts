import { join } from 'node:path';
import type { Context } from '../context.js';
import { getTemplateData, renderTemplateFromFile } from '../../utils/utils.templates.js';
import { TEMPLATE_PATHS } from '../../constants.js';

export default function migrate(context: Context): Context {
  const webpackConfigPath = join('.config', 'webpack', 'webpack.config.ts');
  if (context.doesFileExist(webpackConfigPath)) {
    const templateData = getTemplateData();
    const rendered = renderTemplateFromFile(join(TEMPLATE_PATHS.common, webpackConfigPath), templateData);
    context.updateFile(webpackConfigPath, rendered);
  }
  return context;
}
