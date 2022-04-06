const { marked } = require('marked');
const TerminalRenderer = require('marked-terminal');
const { Confirm, Select } = require('enquirer');

marked.setOptions({
  renderer: new TerminalRenderer(),
});

export function confirmPrompt(message: string) {
  const prompt = new Confirm({
    name: 'question',
    message,
  });

  return prompt.run();
}

export function selectPrompt(message: string, choices: string[]) {
  const prompt = new Select({
    message,
    choices,
  });

  return prompt.run();
}

export function printMarkdown(content: string) {
  console.log(marked(content));
}
