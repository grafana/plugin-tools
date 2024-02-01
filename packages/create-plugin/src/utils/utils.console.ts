import { marked } from 'marked';
import chalk, { type ForegroundColorName } from 'chalk';
import boxen from 'boxen';
import TerminalRenderer from 'marked-terminal';
import Enquirer from 'enquirer';

const { prompt } = Enquirer;

marked.setOptions({
  renderer: new TerminalRenderer({
    firstHeading: chalk.hex('#ff9900').underline.bold,
  }),
});

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
  console.log(displayAsMarkdown(`\n✔ ${msg}`).trim());
}

export function printError(error: string) {
  console.error(displayAsMarkdown(`\n❌ ${error}`));
}

export async function confirmPrompt(message: string): Promise<boolean> {
  const question: Record<string, boolean> = await prompt({
    name: 'confirmPrompt',
    type: 'confirm',
    message: displayAsMarkdown(message),
  });

  return question['confirmPrompt'];
}

export async function selectPrompt(message: string, choices: string[]): Promise<string> {
  const question: Record<string, string> = await prompt({
    name: 'selectPrompt',
    type: 'select',
    choices,
    message: displayAsMarkdown(message),
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
