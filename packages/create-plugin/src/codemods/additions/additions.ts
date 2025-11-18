import { Codemod } from '../types.js';

export default [
  {
    name: 'example-addition',
    description: 'Adds an example addition to the plugin',
    scriptPath: import.meta.resolve('./scripts/example-addition.js'),
  },
] satisfies Codemod[];
