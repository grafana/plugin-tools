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

export async function gitCommitNoVerify(commitMsg: string) {
  try {
    let addAllCommand = 'git add -A';
    let commitCommand = `git commit --no-verify -m '${commitMsg}'`;

    await exec(addAllCommand);
    await exec(commitCommand);
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
    const { stdout } = await exec(`git grep -n --untracked -F "TODO(${additionName})"`, { cwd });

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
