import { Codemod } from '../types.js';

export default [
  {
    name: 'example-addition',
    description: 'Adds an example addition to the plugin',
    scriptPath: './scripts/example-addition.ts',
  },
] satisfies Codemod[];
