import minimist from 'minimist';

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
});

export const commandName = argv._[0] || 'generate';
