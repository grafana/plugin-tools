import { MIN_GRAFANA_VERSION } from './constants';

export const versionedAPIs = {
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
    healthCheck: {
      [MIN_GRAFANA_VERSION]: 'api/datasources/uid/*/health',
    },
  },
  Dashboard: {
    delete: {
      [MIN_GRAFANA_VERSION]: (uid: string) => `/api/datasources/uid/${uid}`,
    },
  },
};
