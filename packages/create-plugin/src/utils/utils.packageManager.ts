import { basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { findUpSync } from 'find-up';
import { getPackageJson } from './utils.packagejson.js';

const NPM_LOCKFILE = 'package-lock.json';
const PNPM_LOCKFILE = 'pnpm-lock.yaml';
const YARN_LOCKFILE = 'yarn.lock';
const SUPPORTED_PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm'];
const DEFAULT_PACKAGE_MANAGER = { packageManagerName: 'yarn', packageManagerVersion: '1.22.22' };

export type PackageManager = {
  packageManagerName: string;
  packageManagerVersion: string;
};

export function getPackageManagerFromUserAgent(): PackageManager {
  const agent = process.env.npm_config_user_agent;

  if (!agent) {
    return DEFAULT_PACKAGE_MANAGER;
  }

  const [name, versionWithText] = agent.split('/');
  const [version] = versionWithText.split(' ');

  if (SUPPORTED_PACKAGE_MANAGERS.includes(name)) {
    return { packageManagerName: name, packageManagerVersion: version.trimEnd() };
  }

  return DEFAULT_PACKAGE_MANAGER;
}

export function getPackageManagerWithFallback() {
  const packageManagerFromPackageJson = getPackageManagerFromPackageJson();
  if (packageManagerFromPackageJson) {
    return packageManagerFromPackageJson;
  }

  const packageManagerFromLockFile = getPackageManagerFromLockFile();
  if (packageManagerFromLockFile) {
    return packageManagerFromLockFile;
  }

  return DEFAULT_PACKAGE_MANAGER;
}

export function getPackageManagerInstallCmd(packageManagerName: string) {
  switch (packageManagerName) {
    case 'yarn':
      return 'yarn install --immutable --prefer-offline';

    case 'pnpm':
      return 'pnpm install --frozen-lockfile --prefer-offline';

    default:
      return 'npm ci';
  }
}

function getPackageManagerFromLockFile(): PackageManager | undefined {
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
      const packageManagerVersion = npmVersionCommand.stdout.toString().trimEnd();
      return { packageManagerName: 'npm', packageManagerVersion };
    }

    if (closestLockfile === PNPM_LOCKFILE) {
      const pnpmVersionCommand = spawnSync('pnpm', ['--version'], {
        shell: true,
      });
      const packageManagerVersion = pnpmVersionCommand.stdout.toString().trimEnd();
      return { packageManagerName: 'pnpm', packageManagerVersion };
    }

    if (closestLockfile === YARN_LOCKFILE) {
      const yarnVersionCommand = spawnSync('yarn', ['--version'], {
        shell: true,
      });
      const packageManagerVersion = yarnVersionCommand.stdout.toString().trimEnd();
      return { packageManagerName: 'yarn', packageManagerVersion };
    }

    return undefined;
  } catch (error) {
    console.error('Failed to find package manager from lock file. Have you installed dependencies?');
    if (error instanceof Error) {
      throw error;
    }
    return undefined;
  }
}

function getPackageManagerFromPackageJson(): PackageManager | undefined {
  const packageJson = getPackageJson();
  if (packageJson?.packageManager) {
    const [packageManagerName, packageManagerVersion] = packageJson.packageManager.split('@');
    return { packageManagerName, packageManagerVersion };
  }

  return undefined;
}
