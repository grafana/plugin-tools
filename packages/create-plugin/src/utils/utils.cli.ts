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
  },
  // tell minimist to parse boolean flags as true/false to prevent minimist from interpreting
  // them as the command name if passed first. e.g. `create-plugin --force update`
  boolean: ['force', 'experimental-updates'],
  // --agent is tri-state: absent, bare (pick an agent), or a value (an agent id or a path to a binary).
  // parsing it as a string keeps bare --agent as '' rather than true, so all three are distinguishable.
  // --no-agent still arrives as false.
  string: ['agent'],
});

export const commandName = argv._[0] || 'generate';
