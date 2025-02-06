#!/usr/bin/env node

import minimist from 'minimist';
import { generate, update, migrate, version, provisioning } from '../commands/index.js';
import { isUnsupportedPlatform } from '../utils/utils.os.js';
import { argv, commandName } from '../utils/utils.cli.js';
import { output } from '../utils/utils.output.js';

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
};
const command = commands[commandName] || 'generate';

command(argv);
