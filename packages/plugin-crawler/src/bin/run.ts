// #!/usr/bin/env node
import { Command } from 'commander';
import { pluginsCommand } from '../commands/plugins.js';
import { extensionsCommand } from '../commands/extensions.js';
import { infoCommand } from '../commands/info.js';

const program = new Command();

program.name('grafana-plugins').description('A CLI for getting info about internal grafana plugins').version('0.0.1');

// Extensions
program
  .command('extensions')
  .option('-p, --pluginId <type>', 'A plugin ID to filter by, e.g. "grafana-piechart-panel" or "*slo*"')
  .option('--addedLinks', 'List added links')
  .option('--addedComponents', 'List added components')
  .option('--extensionPoints', 'List extension points')
  .option('--exposedComponents', 'List exposed components')
  .option('--no-cache', 'Disables cachcing and re-fetches all data')
  .option('--json', 'Prints out data as JSON')
  .description('Get information about usages of the extensions framework in internal app plugins.')
  .action(extensionsCommand);

// Plugins
program
  .command('plugins')
  .option('--id <type>', 'A plugin ID to filter by, e.g. "grafana-piechart-panel" or "*slo*"')
  .option('--pluginJsonFieldDefined <type>', 'E.g. "extensions.dependencies"')
  .option('--panel', 'List panel plugins')
  .option('--datasource', 'List datasource plugins')
  .option('--app', 'List app plugins')
  .option('--no-cache', 'Disables cachcing and re-fetches all data')
  .option('--json', 'Prints out data as JSON')
  .description('Get information about plugins')
  .action(pluginsCommand);

program.command('info').action(infoCommand);

program.parse();
