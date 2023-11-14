import { MIN_GRAFANA_VERSION } from './constants';

export const versionedAPIs = {
  DataSource: {
    resource: {
      '9.4.4': '/api/datasources/uid/*/resources',
      [MIN_GRAFANA_VERSION]: '/api/datasources/*/resources',
    },
    query: {
      [MIN_GRAFANA_VERSION]: '*/**/api/ds/query*',
    },
  },
};
