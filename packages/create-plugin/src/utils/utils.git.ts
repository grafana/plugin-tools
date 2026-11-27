import { execFile as nodeExecFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ProjectLayout } from './utils.project.js';

// execFile passes arguments straight to git, so paths and commit messages never go through a shell.
const execFile = promisify(nodeExecFile);

export interface GitScope {
  // Directory git runs in. Defaults to the current working directory.
  cwd?: string;
  // Pathspecs (relative to `cwd`) the command is limited to. Defaults to the whole repository.
  paths?: string[];
}

// Files at the root of a monorepo that create-plugin manages alongside the plugins.
const MONOREPO_ROOT_PATHS = [
  '.config',
  '.cprc.json',
  '.github',
  '.nvmrc',
  '.npmrc',
  '.yarnrc.yml',
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'yarn.lock',
  'docker-compose.yaml',
  'release-please-config.json',
  '.release-please-manifest.json',
];

function pathspecArgs(paths: string[] = []) {
  return paths.length > 0 ? ['--', ...paths] : [];
}

export async function isGitDirectory() {
  try {
    const response = await execFile('git', ['rev-parse', '--is-inside-work-tree']);

    return response.stdout.trim() === 'true';
  } catch (error) {
    // We also return `false` if the command fails (e.g. if the user doesn't have git installed)
    return false;
  }
}

export async function isGitDirectoryClean({ cwd, paths }: GitScope = {}) {
  try {
    const response = await execFile('git', ['status', '--porcelain', ...pathspecArgs(paths)], { cwd });

    return response.stdout.trim() === '';
  } catch (error) {
    // We also return `false` if the command fails (e.g. if the user doesn't have git installed)
    return false;
  }
}

/**
 * Commits the given paths (or everything when no paths are given) without running git hooks.
 * Limiting the commit to paths keeps unrelated changes in a monorepo out of create-plugin's commits.
 */
export async function gitCommitNoVerify(commitMsg: string, { cwd, paths }: GitScope = {}) {
  try {
    await execFile('git', ['add', '-A', ...pathspecArgs(paths)], { cwd });
    await execFile('git', ['commit', '--no-verify', '-m', commitMsg, ...pathspecArgs(paths)], { cwd });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error committing changes:\n${error.message}`);
    }
  }
}

export interface AdditionTodo {
  file: string;
  line: number;
  text: string;
}

const GIT_GREP_LINE_PATTERN = /^(.+?):(\d+):(.*)$/;

// Finds the `TODO(<additionName>)` markers an addition's instructions ask the agent to leave for
// anything it could not apply. --untracked covers files the addition created
export async function findAdditionTodos(additionName: string, cwd: string): Promise<AdditionTodo[]> {
  try {
    const { stdout } = await execFile('git', ['grep', '-n', '--untracked', '-F', `TODO(${additionName})`], { cwd });

    return stdout
      .split('\n')
      .map((line) => GIT_GREP_LINE_PATTERN.exec(line))
      .filter((match): match is RegExpExecArray => match !== null)
      .map(([, file, line, text]) => ({ file, line: Number(line), text: text.trim() }));
  } catch (error) {
    // git grep exits 1 when nothing matches. that, and git being unavailable, both mean nothing to report
    return [];
  }
}

/**
 * The paths (relative to the project root) that create-plugin reads and writes in a project.
 */
export function getProjectGitPaths(project: ProjectLayout): string[] {
  if (project.kind === 'single') {
    return ['.'];
  }

  return [...MONOREPO_ROOT_PATHS, ...project.plugins.map((plugin) => plugin.dir)];
}
