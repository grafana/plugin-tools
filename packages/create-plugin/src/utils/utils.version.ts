import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getVersion } from '@libs/version';
import { TEMPLATE_PATHS } from '../constants.js';

export const CURRENT_APP_VERSION = getVersion();

export function getGrafanaRuntimeVersion() {
  const packageJsonPath = path.join(TEMPLATE_PATHS.common, '_package.json');
  const pkg = readFileSync(packageJsonPath, 'utf8');
  const { version } = /\"(@grafana\/runtime)\":\s\"\^(?<version>.*)\"/.exec(pkg)?.groups ?? {};
  return version;
}
