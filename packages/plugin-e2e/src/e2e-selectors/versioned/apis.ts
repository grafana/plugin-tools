import { MIN_GRAFANA_VERSION } from './constants';
import { verifySelector, verifySelectorWithArgs, verifySelectorGroup } from './utils';

const selectors = {
  DataSource: {
    resourcePattern: verifySelector({
      [MIN_GRAFANA_VERSION]: () => '/api/datasources/*/resources',
    }),
    resourceUIDPattern: verifySelector({
      '9.4.4': () => '/api/datasources/uid/*/resources',
      [MIN_GRAFANA_VERSION]: () => '/api/datasources/*/resources',
    }),
    queryPattern: verifySelector({
      [MIN_GRAFANA_VERSION]: () => '*/**/api/ds/query*',
    }),
    query: verifySelector({
      [MIN_GRAFANA_VERSION]: () => '/api/ds/query',
    }),
    health: verifySelectorWithArgs<{ uid: string; id: string }>({
      ['9.5.0']: (args) => `/api/datasources/uid/${args.uid}/health`,
      [MIN_GRAFANA_VERSION]: (args) => `/api/datasources/${args.id}/health`,
    }),
    datasourceByUID: verifySelectorWithArgs<{ uid: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/api/datasources/uid/${args.uid}`,
    }),
    proxy: verifySelectorWithArgs<{ uid: string; id: string }>({
      '9.4.0': (args) => `api/datasources/proxy/uid/${args.uid}`,
      [MIN_GRAFANA_VERSION]: (args) => `/api/datasources/proxy/${args.id}`,
    }),
  },
  Dashboard: {
    delete: verifySelectorWithArgs<{ uid: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/api/datasources/uid/${args.uid}`,
    }),
  },
  Plugin: {
    settings: verifySelectorWithArgs<{ pluginId: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/api/plugins/${args.pluginId}/settings`,
    }),
  },
};

export type VersionedAPIs = typeof selectors;
export const versionedAPIs = verifySelectorGroup<VersionedAPIs>(selectors);
