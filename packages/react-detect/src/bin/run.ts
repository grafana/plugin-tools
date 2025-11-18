#!/usr/bin/env node

import minimist from 'minimist';
import { detect19 } from '../commands/detect19.js';

const args = process.argv.slice(2);
const argv = minimist(args);

const commands: Record<string, (argv: minimist.ParsedArgs) => Promise<void>> = {
  detect19,
  detect: detect19, // Alias
};

// Default to detect19 if no command specified
const commandName = argv._[0] || 'detect19';
const command = commands[commandName];

if (!command) {
  console.error(`Unknown command: ${commandName}`);
  console.error('Available commands: detect19, detect');
  process.exit(1);
}

command(argv).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
