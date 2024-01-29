import { exec as nodeExec } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(nodeExec);

export async function isGitDirectory() {
  let command = 'git rev-parse --is-inside-work-tree';

  try {
    const response = await exec(command);

    return response.stdout.trim() === 'true';
  } catch (error) {
    if (error instanceof Error && error.message.includes('fatal: not a git repository')) {
      return false;
    }

    throw new Error(
      `Failed to detect if you are in a git directory (used "${command}"). 
This check is necessary so we don't accidentally override any changes you might have made to your files. 
If you are certain you would like to continue, you can run the command again with the --force flag.`
    );
  }
}

export async function isGitDirectoryClean() {
  try {
    let command = 'git status --porcelain';
    const response = await exec(command);

    return response.stdout.trim() === '';
  } catch (error) {
    throw new Error(`Failed to detect if your git directory is clean (used "git status --porcelain").
This check is necessary so we don't accidentally override any changes you might have made to your files. 
If you are certain you would like to continue, you can run the command again with the --force flag.`);
  }
}
