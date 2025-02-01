import minimist from 'minimist';
import createDebug from 'debug';

export const debug = createDebug('create-plugin');

export const args = process.argv.slice(2);

export const argv = minimist(args, {
  alias: {
    f: 'force',
    // these are aliased to make it easier to use but internally we always use the object keys
    pluginType: 'plugin-type',
    hasBackend: 'backend',
    pluginName: 'plugin-name',
    orgName: 'org-name',
    // temporary flag whilst we work on the migration updates
    experimentalUpdates: 'experimental-updates',
  },
});

export const commandName = argv._[0] || 'generate';
