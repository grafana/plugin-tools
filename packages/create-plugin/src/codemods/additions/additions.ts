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
    name: 'experimental-app-sdk',
    description: 'Adds grafana-app-sdk CUE kind code generation to an app plugin',
    scriptPath: import.meta.resolve('./scripts/experimental-app-sdk.js'),
  },
  {
    name: 'docs',
    description: 'Scaffolds multi-page documentation for a Grafana plugin',
    scriptPath: import.meta.resolve('./scripts/docs.js'),
  },
] satisfies Codemod[];
