import minimist from 'minimist';
// @ts-ignore
import { Confirm, Input, Select } from 'enquirer';
import { PLUGIN_TYPES } from '../../constants';
import { CliArgs } from '../types';

export async function promptUser(argv: minimist.ParsedArgs): Promise<CliArgs> {
  const answers = {} as CliArgs;

  for (const promptDefinition of prompts) {
    const { name, type, message, validate, initial, choices } = promptDefinition;
    if (argv[name]) {
      answers[name] = argv[name];
    } else {
      let prompt;

      if (type === 'input') {
        prompt = new Input({
          name,
          message,
          validate,
          initial,
        });
      }

      if (type === 'select') {
        prompt = new Select({
          name,
          message,
          choices,
        });
      }

      const promptResult = await prompt.run();
      answers[name] = promptResult;
    }
  }

  if (answers.pluginType !== PLUGIN_TYPES.panel) {
    const hasBackendPrompt: Prompt = {
      name: 'hasBackend',
      type: 'confirm',
      message: 'Do you want a backend part of your plugin?',
      initial: false,
    };
    if (argv[hasBackendPrompt.name]) {
      answers[hasBackendPrompt.name] = argv[hasBackendPrompt.name];
    } else {
      const prompt = new Confirm(hasBackendPrompt);
      const promptResult = await prompt.run();

      answers[hasBackendPrompt.name] = promptResult;
    }
  }

  for (const promptDefinition of workflowPrompts) {
    const { name } = promptDefinition;
    if (argv[name]) {
      answers[name] = argv[name];
    } else {
      const prompt = new Confirm(promptDefinition);

      const promptResult = await prompt.run();
      answers[name] = promptResult;
    }
  }

  return answers;
}

type Prompt = {
  name: keyof CliArgs;
  type: string;
  message: string;
  validate?: (value: string) => void;
  initial?: string | Boolean;
  choices?: string[] | Array<Record<string, string>>;
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
];

const workflowPrompts: Prompt[] = [
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
