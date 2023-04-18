import { basename } from 'path';
import { spawnSync } from 'child_process';
import { sync as findUpSync } from 'find-up';

const NPM_LOCKFILE = 'package-lock.json';
const PNPM_LOCKFILE = 'pnpm-lock.yaml';
const YARN_LOCKFILE = 'yarn.lock';
const SUPPORTED_PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm'];

export function getPackageManagerFromUserAgent() {
  const agent = process.env.npm_config_user_agent;

  const [packageManager, versionWithText] = agent.split('/');
  const [version] = versionWithText.split(' ');

  if (SUPPORTED_PACKAGE_MANAGERS.includes(packageManager)) {
    return { packageManager, version };
  }
  // default to yarn 1 as legacy option.
  return { packageManager: 'yarn', version: '1.22.19' };
}

export function getPackageManagerFromLockFile() {
  const closestLockfilePath = findUpSync([YARN_LOCKFILE, PNPM_LOCKFILE, NPM_LOCKFILE]);
  if (!Boolean(closestLockfilePath)) {
    return undefined;
  }

  const closestLockfile = closestLockfilePath && basename(closestLockfilePath);

  try {
    if (closestLockfile === NPM_LOCKFILE) {
      const npmVersionCommand = spawnSync('npm', ['--version'], {
        shell: true,
      });
      const version = npmVersionCommand.stdout;
      return { packageManager: 'npm', version };
    }

    if (closestLockfile === PNPM_LOCKFILE) {
      const npmVersionCommand = spawnSync('pnpm', ['--version'], {
        shell: true,
      });
      const version = npmVersionCommand.stdout;
      return { packageManager: 'pnpm', version };
    }

    if (closestLockfile === YARN_LOCKFILE) {
      const npmVersionCommand = spawnSync('yarn', ['--version'], {
        shell: true,
      });
      const version = npmVersionCommand.stdout;
      return { packageManager: 'yarn', version };
    }

    return undefined;
  } catch (error) {
    // DO SOMETHING SMART HERE.
    console.error('Failed to find package manager from lock file');
    throw Error(error);
  }
}

export function getPackageManagerInstallCmd(packageManager: string) {
  switch (packageManager) {
    case 'yarn':
      return 'yarn install --immutable --prefer-offline';

    case 'pnpm':
      return 'pnpm install --frozen-lockfile --prefer-offline';

    default:
      return 'npm ci';
  }
}
