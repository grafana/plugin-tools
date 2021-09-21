#!/usr/bin/env node

import { Plop, run } from 'plop';
import minimist from 'minimist';
import { PLOP_FILE } from '../constants';

const args = process.argv.slice(2);
const argv = minimist(args);

Plop.launch(
  {
    cwd: argv.cwd,
    configPath: PLOP_FILE,
    require: argv.require,
    completion: argv.completion,
  },
  (env) => run(env, undefined, true)
);
