import { Codemod } from '../types.js';

export default [
  {
    name: 'example-addition',
    description: 'Adds an example addition to the plugin',
    scriptPath: import.meta.resolve('./scripts/example-addition.js'),
  },
  {
    name: 'externalize-jsx-runtime',
    description: 'Externalizes the react JSX runtime to help migrate plugins to React 19',
    scriptPath: import.meta.resolve('./scripts/externalize-jsx-runtime.js'),
  },
  {
    name: 'add-rspack',
    description: 'Converts an existing webpack-based plugin to use rspack as the frontend bundler',
    scriptPath: import.meta.resolve('./scripts/add-rspack.js'),
  },
] satisfies Codemod[];
