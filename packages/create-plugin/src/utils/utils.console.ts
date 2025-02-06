import { marked, MarkedExtension } from 'marked';
import chalk, { type ForegroundColorName } from 'chalk';
import boxen from 'boxen';
import { markedTerminal } from 'marked-terminal';
import Enquirer from 'enquirer';
import { Output } from '@libs/output';
import { getVersion } from './utils.version.js';

export const output = new Output('create plugin', getVersion());
const { prompt } = Enquirer;

// They're compatible but this type assertion is required because @types/marked-terminal needs changes.
marked.use(
  markedTerminal({
    firstHeading: chalk.hex('#ff9900').underline.bold,
  }) as MarkedExtension
);

export function printHeader(message: string, status: 'success' | 'info' | 'error' = 'success') {
  const color = status === 'success' ? 'green' : status === 'info' ? 'blue' : 'red';
  let prefix = chalk.reset.inverse.bold[color](` CREATE PLUGIN `);
  let txt = chalk[color](message);
  console.log(`${prefix}  ${txt}`);
}

export function displayAsMarkdown(msg: string) {
  return marked(msg);
}

export function displayArrayAsList(files: string[]) {
  return ` - ${files.map((t) => `\`${t}\``).join('\n - ')}`;
}

export function printMessage(msg: string) {
  console.log(displayAsMarkdown(`\n${msg}`));
}

export function printSuccessMessage(msg: string) {
  console.log(displayAsMarkdown(`\n✔ ${msg}`));
}

export function printError(error: string) {
  console.error(displayAsMarkdown(`\n❌ ${error}`));
}

export function printWarning(error: string) {
  console.warn(displayAsMarkdown(`\n⚠️ ${error}`));
}

export async function confirmPrompt(message: string): Promise<boolean> {
  const mkdMessage = await displayAsMarkdown(message);
  const question: Record<string, boolean> = await prompt({
    name: 'confirmPrompt',
    type: 'confirm',
    message: mkdMessage,
  });

  return question['confirmPrompt'];
}

export async function selectPrompt(message: string, choices: string[]): Promise<string> {
  const mkdMessage = await displayAsMarkdown(message);
  const question: Record<string, string> = await prompt({
    name: 'selectPrompt',
    type: 'select',
    choices,
    message: mkdMessage,
  });

  return question['selectPrompt'];
}

type PrintBoxArgs = {
  title: string;
  content: string;
  subtitle?: string;
  color?: ForegroundColorName;
};

export function printRedBox({ title, subtitle, content }: PrintBoxArgs) {
  printBox({ title, subtitle, content, color: 'red' });
}

export function printBlueBox({ title, subtitle, content }: PrintBoxArgs) {
  printBox({ title, subtitle, content, color: 'blue' });
}

export function printGreenBox({ title, subtitle, content }: PrintBoxArgs) {
  printBox({ title, subtitle, content, color: 'green' });
}

export function printBox({ title, subtitle, content, color = 'gray' }: PrintBoxArgs) {
  console.log(
    boxen(chalk[color](`${chalk.bold(title)}${subtitle ? ` ${subtitle}` : ''}\n\n${content}`), {
      padding: 1,
      borderColor: color,
    })
  );
}
