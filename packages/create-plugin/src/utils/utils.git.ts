import { exec as nodeExec } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(nodeExec);

export async function isGitDirectory() {
  let command = 'git rev-parse --is-inside-work-tree';

  try {
    const response = await exec(command);

    return response.stdout.trim() === 'true';
  } catch (error) {
    // We also return `false` if the command fails (e.g. if the user doesn't have git installed)
    return false;
  }
}

export async function isGitDirectoryClean() {
  try {
    let command = 'git status --porcelain';
    const response = await exec(command);

    return response.stdout.trim() === '';
  } catch (error) {
    // We also return `false` if the command fails (e.g. if the user doesn't have git installed)
    return false;
  }
}
