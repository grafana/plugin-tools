import minimist from 'minimist';
import { printWarning } from './utils.console.js';

export const args = process.argv.slice(2);

export const argv = minimist(args, {
  alias: {
    f: 'force',
    // these are aliased to make it easier to use but internally we always use the object keys
    pluginType: 'plugin-type',
    hasBackend: 'backend',
    pluginName: 'plugin-name',
    orgName: 'org-name',
  },
  unknown: (arg) => {
    printWarning(`Ignoring unknown option: ${arg}.`);
    return false;
  },
});

export const commandName = argv._[0] || 'generate';
