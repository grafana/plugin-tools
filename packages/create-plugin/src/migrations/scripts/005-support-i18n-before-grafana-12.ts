import type { Context } from '../context.js';
import { addDependenciesToPackageJson } from '../utils.js';

export default async function migrate(context: Context): Promise<Context> {
  if (!context.doesFileExist('package.json')) {
    return context;
  }

  addDependenciesToPackageJson(context, {
    '@grafana/data': '^12.2.0',
    '@grafana/i18n': '^12.2.0',
    '@grafana/runtime': '^12.2.0',
    '@grafana/ui': '^12.2.0',
    '@grafana/schema': '^12.2.0',
  });

  return context;
}
