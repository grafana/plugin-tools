import { Codemod } from '../types.js';
import { resolveScriptPath } from '../utils.js';

export default [
  {
    name: 'example-addition',
    description: 'Example addition demonstrating Valibot schema with type inference',
    scriptPath: resolveScriptPath(import.meta.url, './scripts/example-addition.js'),
  },
] satisfies Codemod[];
