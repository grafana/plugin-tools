// #!/usr/bin/env node
import { Command } from 'commander';
import { pluginsCommand } from '../commands/plugins.js';
import { extensionsCommand } from '../commands/extensions.js';

const program = new Command();

program.name('grafana-plugins').description('A CLI for getting info about internal grafana plugins').version('0.0.1');

// Plugins
program
  .command('plugins')
  .option('--id <type>', 'A plugin ID to filter by, e.g. "grafana-piechart-panel" or "slo"')
  .option(
    '--pluginJsonFieldDefined <type>',
    'Use it to check if a certain field is present in the plugin.json, e.g. "extensions.dependencies"'
  )
  .option('-d, --dependency <value...>', 'Filter plugins by their dependencies, e.g. "@grafana/scenes" ')
  .option('--panel', 'List panel plugins')
  .option('--datasource', 'List datasource plugins')
  .option('--app', 'List app plugins')
  .option('--no-cache', 'Disables cachcing and re-fetches all data')
  .option('--json', 'Prints out data as JSON')
  .option('-v, --verbose', 'Prints out a more detailed output')
  .description('Get information about plugins')
  .action(pluginsCommand);

// Extensions
program
  .command('extensions')
  .option('--pluginId <type>', 'Filter plugins by id, e.g. "grafana-piechart-panel" or "slo"')
  .option('--addedLinks', 'List plugins that register link extensions')
  .option('--addedComponents', 'List plugins that register component extensions')
  .option('--extensionPoints', 'List plugins that provide extension points')
  .option('--exposedComponents', 'List plugins that are exposing components')
  .option('--exposedComponentUsages', 'List plugins that are consuming exposed components')
  .option('--no-cache', 'Disables cachcing and re-fetches all data')
  .option('--json', 'Prints out data as JSON')
  .option('-v, --verbose', 'Prints out a more detailed output')
  .description('Get information about usages of the extensions framework in internal app plugins.')
  .action(extensionsCommand);

program.parse();
