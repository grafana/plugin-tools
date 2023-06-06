#!/usr/bin/env node

import minimist from 'minimist';
import { generate, update, migrate, version } from '../commands';
import { isUnsupportedPlatform } from '../utils/utils.os';

// Exit early if operating system isn't supported.
if (isUnsupportedPlatform()) {
  console.error("Unsupported operating system 'Windows' detected. Please use WSL with create-plugin.");
  process.exit(1);
}

const args = process.argv.slice(2);
const argv = minimist(args);
const commands: Record<string, (argv: minimist.ParsedArgs) => void> = {
  migrate,
  generate,
  update,
  version,
};
const command = commands[argv._[0]] || commands.generate;

command(argv);
