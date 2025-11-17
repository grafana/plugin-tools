import { Codemod } from '../types.js';

export default [
  {
    name: 'example-addition',
    description: 'Example addition demonstrating Valibot schema with type inference',
    scriptPath: import.meta.resolve('./scripts/example-addition.js'),
  },
] satisfies Codemod[];
