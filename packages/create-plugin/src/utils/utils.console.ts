const { marked } = require('marked');
const chalk = require('chalk');
const TerminalRenderer = require('marked-terminal');
const { Confirm, Select } = require('enquirer');

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

export function confirmPrompt(message: string): Promise<boolean> {
  const prompt = new Confirm({
    name: 'question',
    message: displayAsMarkdown(message),
  });

  return prompt.run();
}

export function selectPrompt(message: string, choices: string[]): Promise<string> {
  const prompt = new Select({
    choices,
    message: displayAsMarkdown(message),
  });

  return prompt.run();
}
