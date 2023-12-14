import { DataSource } from '../types';
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
    query: {
      [MIN_GRAFANA_VERSION]: '/api/ds/query',
    },
    health: {
      ['9.5.0']: ({ uid }: DataSource) => `/api/datasources/uid/${uid}/health`,
      [MIN_GRAFANA_VERSION]: ({ id }: DataSource) => `/api/datasources/${id}/health`,
    },
    delete: {
      [MIN_GRAFANA_VERSION]: (uid: string) => `/api/datasources/uid/${uid}`,
    },
  },
  Dashboard: {
    delete: {
      [MIN_GRAFANA_VERSION]: (uid: string) => `/api/datasources/uid/${uid}`,
    },
  },
};
