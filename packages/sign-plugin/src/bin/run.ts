#!/usr/bin/env node

import minimist from 'minimist';
import { sign, version } from '../commands/index.js';

const [major, minor] = process.versions.node.split('.').map(Number);

if (major < 24 || (major === 24 && minor < 5)) {
  console.error(`Node.js >=24.5.0 is required. Current: ${process.version}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const argv = minimist(args);

const commands: Record<string, (argv: minimist.ParsedArgs) => void> = {
  sign,
  version,
};
const command = commands[argv._[0]] || commands.sign;

command(argv);
