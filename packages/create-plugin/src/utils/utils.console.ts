import { styleText } from 'node:util';
import Enquirer from 'enquirer';
import { Output } from '@libs/output';
import { CURRENT_APP_VERSION } from './utils.version.js';

export const output = new Output('create-plugin', CURRENT_APP_VERSION);
const { prompt } = Enquirer;

export function displayArrayAsList(files: string[]) {
  return ` - ${files.map((t) => `\`${t}\``).join('\n - ')}`;
}

export async function confirmPrompt(message: string): Promise<boolean> {
  const question: Record<string, boolean> = await prompt({
    name: 'confirmPrompt',
    type: 'confirm',
    message: styleText(['bold'], message),
  });

  return question['confirmPrompt'];
}

export async function selectPrompt(message: string, choices: string[]): Promise<string> {
  const question: Record<string, string> = await prompt({
    name: 'selectPrompt',
    type: 'select',
    choices,
    message: styleText(['bold'], message),
  });

  return question['selectPrompt'];
}
