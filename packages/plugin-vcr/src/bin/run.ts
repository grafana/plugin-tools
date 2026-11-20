#!/usr/bin/env node

import { main } from '../cli.js';

main(process.argv.slice(2)).catch((err: Error) => {
  console.error(err.message);
  process.exitCode = 1;
});
