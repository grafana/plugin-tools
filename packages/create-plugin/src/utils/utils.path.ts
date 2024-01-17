import path from 'node:path';
import { PLUGIN_TYPES, IS_DEV, DEV_EXPORT_DIR } from '../constants.js';
import { normalizeId } from './utils.handlebars.js';

export function getExportPath(pluginName: string, orgName: string, pluginType: PLUGIN_TYPES): string {
  if (IS_DEV) {
    return DEV_EXPORT_DIR;
  } else {
    return path.join(process.cwd(), normalizeId(pluginName, orgName, pluginType));
  }
}
