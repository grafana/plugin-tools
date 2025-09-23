import type { Configuration } from 'webpack';
import type { RspackOptions } from '@rspack/core';

const externals = [
  // Required for dynamic publicPath resolution
  { 'amd-module': 'module' },
  'lodash',
  'jquery',
  'moment',
  'slate',
  'emotion',
  '@emotion/react',
  '@emotion/css',
  'prismjs',
  'slate-plain-serializer',
  '@grafana/slate-react',
  'react',
  'react-dom',
  'react-redux',
  'redux',
  'rxjs',
  'i18next',
  'react-router',{{#unless useReactRouterV6}}
  'react-router-dom',{{/unless}}
  'd3',
  'angular',{{#unless bundleGrafanaUI}}
  /^@grafana\/ui/i,{{/unless}}
  /^@grafana\/runtime/i,
  /^@grafana\/data/i,{{#if bundleGrafanaUI}}
  'react-inlinesvg', {{/if }}
  
  // Mark legacy SDK imports as external if their name starts with the "grafana/" prefix
  ({ request }, callback) => {
    const prefix = 'grafana/';
    const hasPrefix = (request: string) => request.indexOf(prefix) === 0;
    const stripPrefix = (request: string) => request.substr(prefix.length);

    if (request && hasPrefix(request)) {
      return callback(undefined, stripPrefix(request));
    }

    callback();
  },
];

export const webpackExternals = externals as Configuration['externals'];
export const rspackExternals = externals as RspackOptions['externals'];