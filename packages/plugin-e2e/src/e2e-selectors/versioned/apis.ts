import { MIN_GRAFANA_VERSION } from './constants';
import { createSelector, createSelectorWithArgs } from './factory';

export const versionedAPIs = {
  DataSource: {
    resourcePattern: createSelector({
      [MIN_GRAFANA_VERSION]: () => '/api/datasources/*/resources',
    }),
    resourceUIDPattern: createSelector({
      '9.4.4': () => '/api/datasources/uid/*/resources',
      [MIN_GRAFANA_VERSION]: () => '/api/datasources/*/resources',
    }),
    queryPattern: createSelector({
      [MIN_GRAFANA_VERSION]: () => '*/**/api/ds/query*',
    }),
    query: createSelector({
      [MIN_GRAFANA_VERSION]: () => '/api/ds/query',
    }),
    health: createSelectorWithArgs<{ uid: string; id: string }>({
      ['9.5.0']: (args) => `/api/datasources/uid/${args.uid}/health`,
      [MIN_GRAFANA_VERSION]: (args) => `/api/datasources/${args.id}/health`,
    }),
    datasourceByUID: createSelectorWithArgs<{ uid: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/api/datasources/uid/${args.uid}`,
    }),
    proxy: createSelectorWithArgs<{ uid: string; id: string }>({
      '9.4.0': (args) => `api/datasources/proxy/uid/${args.uid}`,
      [MIN_GRAFANA_VERSION]: (args) => `/api/datasources/proxy/${args.id}`,
    }),
  },
  Dashboard: {
    delete: createSelectorWithArgs<{ uid: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/api/datasources/uid/${args.uid}`,
    }),
  },
  Plugin: {
    settings: createSelectorWithArgs<{ pluginId: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/api/plugins/${args.pluginId}/settings`,
    }),
  },
  A: '',
};
