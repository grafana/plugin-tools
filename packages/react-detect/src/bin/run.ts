#!/usr/bin/env node

import minimist from 'minimist';
import { detect19 } from '../commands/detect19.js';

const args = process.argv.slice(2);
const argv = minimist(args, {
  boolean: ['json', 'skipBuildTooling', 'skipDependencies', 'noErrorExitCode'],
  string: ['pluginRoot'],
  default: {
    json: false,
    skipBuildTooling: false,
    skipDependencies: false,
    noErrorExitCode: false,
  },
});

const commands: Record<string, (argv: minimist.ParsedArgs) => Promise<void>> = {
  detect19,
};

// Default to detect19 if no command specified
const commandName = argv._[0] || 'detect19';
const command = commands[commandName];

command(argv);
