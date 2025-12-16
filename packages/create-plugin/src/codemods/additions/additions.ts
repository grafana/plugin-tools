import { Codemod } from '../types.js';

export default [
  {
    name: 'i18n',
    description: 'Adds internationalization (i18n) support to the plugin',
    scriptPath: import.meta.resolve('./scripts/i18n/index.js'),
  },
] satisfies Codemod[];
