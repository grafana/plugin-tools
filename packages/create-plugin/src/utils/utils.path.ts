import path from 'node:path';
import { PLUGIN_TYPES } from '../constants.js';
import { normalizeId } from './utils.handlebars.js';

export function getExportPath(pluginName: string, orgName: string, pluginType: PLUGIN_TYPES) {
  return path.join(process.cwd(), normalizeId(pluginName, orgName, pluginType));
}
