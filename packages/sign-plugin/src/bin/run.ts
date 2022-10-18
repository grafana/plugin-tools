#!/usr/bin/env node

import minimist from 'minimist';
import { sign } from '../commands';

const args = process.argv.slice(2);
const argv = minimist(args);
const commands: Record<string, (argv: minimist.ParsedArgs) => void> = {
  sign,
};
const command = commands[argv._[0]] || commands.sign;

command(argv);
