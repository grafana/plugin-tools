#!/usr/bin/env node

import { add, generate, migrate, provisioning, update, version } from '../commands/index.js';
import { argv, commandName } from '../utils/utils.cli.js';

import { isUnsupportedPlatform } from '../utils/utils.os.js';
import minimist from 'minimist';
import { output } from '../utils/utils.console.js';

// Exit early if operating system isn't supported.
if (isUnsupportedPlatform()) {
  output.error({
    title: 'Unsupported operating system detected',
    body: ['Create plugin does not support Windows. Please use WSL.'],
    link: 'https://grafana.com/developers/plugin-tools/troubleshooting',
  });

  process.exit(1);
}

const commands: Record<string, (argv: minimist.ParsedArgs) => void> = {
  migrate,
  generate,
  update,
  version,
  provisioning,
  add,
};
const command = commands[commandName] || 'generate';

command(argv);
