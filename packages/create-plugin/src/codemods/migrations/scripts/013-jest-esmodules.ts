import type { Context } from '../../context.js';
import { addGrafanaESModules } from '../../utils.jest.js';

const ESM_MODULES_TO_ADD = ['@react-hookz/web', '@ver0/deep-equal'];

export default function migrate(context: Context): Context {
  return addGrafanaESModules(context, ESM_MODULES_TO_ADD);
}
