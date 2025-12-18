import { Codemod } from '../types.js';

export default [
  {
    name: 'example-addition',
    description: 'Adds an example addition to the plugin',
    scriptPath: import.meta.resolve('./scripts/example-addition.js'),
  },
  {
    name: 'bundle-grafana-ui',
    description: 'Configures the plugin to bundle @grafana/ui instead of using the external provided by Grafana',
    scriptPath: import.meta.resolve('./scripts/bundle-grafana-ui/index.js'),
  },
] satisfies Codemod[];
