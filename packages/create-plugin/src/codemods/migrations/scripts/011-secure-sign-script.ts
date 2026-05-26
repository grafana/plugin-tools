import type { Context } from '../../context.js';
import { addDependenciesToPackageJson } from '../../utils.js';

const SIGN_PLUGIN_VERSION = '^3.2.2';
const NEW_SIGN_SCRIPT = 'sign-plugin';
const INSECURE_SIGN_PATTERN = /^npx\s+(?:--yes|-y)\s+@grafana\/sign-plugin(?:@\S+)?(\s.*)?$/;

export default function migrate(context: Context) {
  if (!context.doesFileExist('package.json')) {
    return context;
  }

  const packageJson = JSON.parse(context.getFile('package.json') || '{}');
  const currentSign: string | undefined = packageJson.scripts?.sign;
  const match = currentSign?.match(INSECURE_SIGN_PATTERN);

  if (match) {
    const trailingArgs = match[1] ?? '';
    packageJson.scripts.sign = `${NEW_SIGN_SCRIPT}${trailingArgs}`;
    context.updateFile('package.json', JSON.stringify(packageJson, null, 2));
  }

  addDependenciesToPackageJson(context, {}, { '@grafana/sign-plugin': SIGN_PLUGIN_VERSION });

  return context;
}
