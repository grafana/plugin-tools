import { VersionedSelectorGroup } from '@grafana/e2e-selectors';
import { MIN_GRAFANA_VERSION } from './minGrafanaVersion';

export const versionedAPIs = {
  Alerting: {
    eval: {
      [MIN_GRAFANA_VERSION]: '/api/v1/eval',
    },
  },
  DataSource: {
    resourcePattern: {
      [MIN_GRAFANA_VERSION]: '/api/datasources/*/resources',
    },
    resourceUIDPattern: {
      '9.4.4': '/api/datasources/uid/*/resources',
      [MIN_GRAFANA_VERSION]: '/api/datasources/*/resources',
    },
    queryPattern: {
      [MIN_GRAFANA_VERSION]: '*/**/api/ds/query*',
    },
    query: {
      [MIN_GRAFANA_VERSION]: '/api/ds/query',
    },
    health: {
      '9.4.0': (uid: string, _: string) => `/api/datasources/uid/${uid}/health`,
      [MIN_GRAFANA_VERSION]: (_: string, id: string) => `/api/datasources/${id}/health`,
    },
    datasourceByUID: {
      [MIN_GRAFANA_VERSION]: (uid: string) => `/api/datasources/uid/${uid}`,
    },
    proxy: {
      '9.4.0': (uid: string, _: string) => `api/datasources/proxy/uid/${uid}`,
      [MIN_GRAFANA_VERSION]: (_: string, id: string) => `/api/datasources/proxy/${id}`,
    },
  },
  Dashboard: {
    delete: {
      [MIN_GRAFANA_VERSION]: (uid: string) => `/api/dashboards/uid/${uid}`,
    },
  },
  Plugin: {
    settings: {
      [MIN_GRAFANA_VERSION]: (pluginId: string) => `/api/plugins/${pluginId}/settings`,
    },
  },
  OpenFeature: {
    ofrepBulkPattern: {
      '12.1.0': '**/apis/features.grafana.app/**/ofrep/v*/evaluate/flags',
    },
    ofrepSinglePattern: {
      '12.1.0': '**/apis/features.grafana.app/**/ofrep/v*/evaluate/flags/*',
    },
    ofrepBulkPath: {
      '12.1.0': (namespace = 'default') =>
        `/apis/features.grafana.app/v0alpha1/namespaces/${namespace}/ofrep/v1/evaluate/flags`,
    },
    ofrepSinglePath: {
      '12.1.0': (namespace = 'default') =>
        `/apis/features.grafana.app/v0alpha1/namespaces/${namespace}/ofrep/v1/evaluate/flags`,
    },
  },
} satisfies VersionedSelectorGroup;

export type VersionedAPIs = typeof versionedAPIs;
