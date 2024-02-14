import minimist from 'minimist';

export const args = process.argv.slice(2);

export const argv = minimist(args, { alias: { f: 'force' } });

export const commandName = argv._[0] || 'generate';
