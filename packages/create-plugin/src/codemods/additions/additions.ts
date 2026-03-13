import { Codemod } from '../types.js';

export default [
  {
    name: 'bundle-grafana-ui',
    description: 'Configures the plugin to bundle @grafana/ui instead of using the external provided by Grafana',
    scriptPath: import.meta.resolve('./scripts/bundle-grafana-ui/index.js'),
  },
  {
    name: 'externalize-jsx-runtime',
    description: 'Externalizes the react JSX runtime to help migrate plugins to React 19',
    scriptPath: import.meta.resolve('./scripts/externalize-jsx-runtime.js'),
  },
] satisfies Codemod[];
