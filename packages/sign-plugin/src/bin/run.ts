#!/usr/bin/env node

import minimist from 'minimist';
import { sign } from '../commands';

const args = process.argv.slice(2);
const argv = minimist(args);

sign(argv);
