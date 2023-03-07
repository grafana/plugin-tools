const { marked } = require('marked');
const TerminalRenderer = require('marked-terminal');
const { Confirm, Select } = require('enquirer');

marked.setOptions({
  renderer: new TerminalRenderer(),
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
  console.log(displayAsMarkdown(`\n✔ ${msg}`));
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
