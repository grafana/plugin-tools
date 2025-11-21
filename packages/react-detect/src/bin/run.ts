#!/usr/bin/env node

import minimist from 'minimist';
import { Output } from '@libs/output';
import { detect19 } from '../commands/detect19.js';

const output = new Output('@grafana/react-detect', '0.0.0');

const args = process.argv.slice(2);
const argv = minimist(args);

const commands: Record<string, (argv: minimist.ParsedArgs, output: Output) => Promise<void>> = {
  detect19,
  detect: detect19, // Alias
};

// Default to detect19 if no command specified
const commandName = argv._[0] || 'detect19';
const command = commands[commandName];

if (!command) {
  output.error({
    title: `Unknown command: ${commandName}`,
    body: ['Available commands: detect19, detect'],
    withPrefix: false,
  });
  process.exit(1);
}

command(argv, output).catch((error) => {
  output.error({
    title: 'Fatal error',
    body: [error.message],
    withPrefix: false,
  });
  process.exit(1);
});
