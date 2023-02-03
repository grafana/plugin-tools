#!/usr/bin/env node

import minimist from 'minimist';
import { sign, version } from '../commands';

const args = process.argv.slice(2);
const argv = minimist(args);

const commands: Record<string, (argv: minimist.ParsedArgs) => void> = {
  sign,
  version,
};
const command = commands[argv._[0]] || commands.sign;

command(argv);
