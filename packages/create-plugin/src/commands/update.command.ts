import minimist from 'minimist';
import { standardUpdate } from './update.standard.command.js';
import { migrationUpdate } from './update.migrate.command.js';

export const update = async (argv: minimist.ParsedArgs) => {
  if (argv.experimentalUpdates) {
    return await migrationUpdate(argv);
  }
  return await standardUpdate(argv);
};
