{{#unless useExperimentalRspack}}import type { Configuration, ExternalItemFunctionData } from 'webpack';{{/unless}}{{#if useExperimentalRspack}}
import type { RspackOptions, ExternalItemFunctionData } from '@rspack/core';{{/if}}

{{#unless useExperimentalRspack}} type ExternalsType = Configuration['externals'];{{/unless}}{{#if useExperimentalRspack}}type ExternalsType = RspackOptions['externals'];{{/if}}

export const externals: ExternalsType = [
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
  'react-inlinesvg',{{/if}}
  
  // Mark legacy SDK imports as external if their name starts with the "grafana/" prefix
  ({ request }: ExternalItemFunctionData, callback: (error?: Error, result?: string) => void) => {
    const prefix = 'grafana/';
    const hasPrefix = (request: string) => request.indexOf(prefix) === 0;
    const stripPrefix = (request: string) => request.slice(prefix.length);

    if (request && hasPrefix(request)) {
      return callback(undefined, stripPrefix(request));
    }

    callback();
  },
];