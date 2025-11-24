import { Codemod } from '../types.js';

export default [
  {
    name: 'example-addition',
    description: 'Adds an example addition to the plugin',
    scriptPath: import.meta.resolve('./scripts/example-addition.js'),
  },
  {
    name: 'i18n',
    description: 'Adds internationalization (i18n) support to the plugin',
    scriptPath: import.meta.resolve('./scripts/i18n.js'),
  },
] satisfies Codemod[];
