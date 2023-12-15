import minimist from 'minimist';
import Enquirer from 'enquirer';
import { PLUGIN_TYPES } from '../../constants';
import { CliArgs } from '../types';

export async function promptUser(argv: minimist.ParsedArgs) {
  let answers;
  const enquirer = new Enquirer();

  for (const prompt of prompts) {
    const { name, when } = prompt;

    if (argv[name]) {
      answers[name] = argv[name];
    } else {
      if (typeof when === 'function' && !when(answers)) {
        continue;
      } else {
        answers = await enquirer.prompt(prompt);
      }
    }
  }

  return answers as CliArgs;
}

type Prompt = {
  name: keyof CliArgs;
  type: string;
  message: string;
  validate?: (value: string) => string | boolean | Promise<string | boolean>;
  initial?: string | Boolean;
  choices?: string[] | Array<Record<string, string>>;
  when?: (answers: Partial<CliArgs>) => Boolean;
};

const prompts: Prompt[] = [
  {
    name: 'pluginName',
    type: 'input',
    message: 'What is going to be the name of your plugin?',
    validate: (value: string) => {
      if (/.+/.test(value)) {
        return true;
      }
      return 'Plugin name is required';
    },
  },
  {
    name: 'orgName',
    type: 'input',
    message: 'What is the organization name of your plugin?',
    validate: (value: string) => {
      if (/.+/.test(value)) {
        return true;
      }
      return 'Organization name is required';
    },
  },
  {
    name: 'pluginDescription',
    type: 'input',
    message: 'How would you describe your plugin?',
    initial: '',
  },
  {
    name: 'pluginType',
    type: 'select',
    choices: [PLUGIN_TYPES.app, PLUGIN_TYPES.datasource, PLUGIN_TYPES.panel, PLUGIN_TYPES.scenes],
    message: 'What type of plugin would you like?',
  },
  {
    name: 'hasBackend',
    type: 'confirm',
    message: 'Do you want a backend part of your plugin?',
    initial: false,
    when: (answers) => answers.pluginType !== PLUGIN_TYPES.panel,
  },
  {
    name: 'hasGithubWorkflows',
    type: 'confirm',
    message: 'Do you want to add Github CI and Release workflows?',
    initial: false,
  },
  {
    name: 'hasGithubLevitateWorkflow',
    type: 'confirm',
    message: 'Do you want to add a Github workflow for automatically checking "Grafana API compatibility" on PRs?',
    initial: false,
  },
];
