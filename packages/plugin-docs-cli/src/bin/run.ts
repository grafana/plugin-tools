#!/usr/bin/env node

import createDebug from 'debug';

const debug = createDebug('plugin-docs-cli:main');

async function main() {
  debug('CLI invoked with args: %O', process.argv.slice(2));
}

main();
