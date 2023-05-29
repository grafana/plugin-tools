#!/usr/bin/env node

import minimist from 'minimist';
import { generate, update, migrate, version } from '../commands';
import { operatingSystemCheck } from '../utils/utils.os';

// Exit early if operating system isn't supported.
operatingSystemCheck();

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
