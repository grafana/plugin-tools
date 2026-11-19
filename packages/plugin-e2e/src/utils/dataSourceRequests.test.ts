import { describe, expect, it } from 'vitest';

import { MIN_GRAFANA_VERSION } from '../selectors/minGrafanaVersion';
import { versionedAPIs } from '../selectors/versionedAPIs';
import { isDataQueryUrl, isDataSourceSaveUrl, isHealthCheckUrl } from './dataSourceRequests';

const ORIGIN = 'http://localhost:3000';
const { DataSource } = versionedAPIs;
const apis = {
  query: DataSource.query[MIN_GRAFANA_VERSION],
  appPlatformQueryPattern: DataSource.appPlatformQueryPattern[MIN_GRAFANA_VERSION],
};
const healthPattern = DataSource.appPlatformHealthPattern[MIN_GRAFANA_VERSION];
const savePattern = DataSource.appPlatformDataSourcePattern[MIN_GRAFANA_VERSION];

describe('isDataQueryUrl', () => {
  it.each([
    `${ORIGIN}/api/ds/query?ds_type=grafana-test-datasource`,
    `${ORIGIN}/api/ds/query?ds_type=prometheus&requestId=Q100`,
    `${ORIGIN}/apis/query.grafana.app/v0alpha1/namespaces/default/query?ds_type=grafana-test-datasource`,
    `${ORIGIN}/apis/datasource.grafana.app/v0alpha1/namespaces/stacks-1/query?ds_type=prometheus&expression=true`,
    `${ORIGIN}/apis/query.grafana.app/v0alpha1/namespaces/default/query`,
    `${ORIGIN}/apis/query.grafana.app/v0alpha1/namespaces/default/query?expression=true&ds_type=prometheus`,
  ])('matches %s', (url) => {
    expect(isDataQueryUrl(url, apis)).toBe(true);
  });

  it.each([
    `${ORIGIN}/api/datasources/uid/abc/health`,
    `${ORIGIN}/apis/dashboard.grafana.app/v1/namespaces/default/dashboards/abc`,
    `${ORIGIN}/apis/query.grafana.app/v0alpha1/namespaces/default/querytemplates`,
    `${ORIGIN}/apis/prometheus.datasource.grafana.app/v0alpha1/namespaces/default/datasources/abc/resources/query`,
  ])('does not match %s', (url) => {
    expect(isDataQueryUrl(url, apis)).toBe(false);
  });
});

describe('isHealthCheckUrl', () => {
  const legacy = '/api/datasources/uid/abc/health';

  it.each([
    `${ORIGIN}/api/datasources/uid/abc/health`,
    `${ORIGIN}/apis/grafana-test-datasource.datasource.grafana.app/v0alpha1/namespaces/default/datasources/abc/health`,
  ])('matches %s', (url) => {
    expect(isHealthCheckUrl(url, legacy, healthPattern('abc'))).toBe(true);
  });

  it.each([
    `${ORIGIN}/apis/grafana-test-datasource.datasource.grafana.app/v0alpha1/namespaces/default/datasources/other/health`,
    `${ORIGIN}/apis/grafana-test-datasource.datasource.grafana.app/v0alpha1/namespaces/default/datasources/abc`,
    `${ORIGIN}/apis/grafana-test-datasource.datasource.grafana.app/v0alpha1/namespaces/default/datasources/abc/resources/health`,
  ])('does not match %s', (url) => {
    expect(isHealthCheckUrl(url, legacy, healthPattern('abc'))).toBe(false);
  });

  it('escapes the uid before matching', () => {
    const url = `${ORIGIN}/apis/x.datasource.grafana.app/v0alpha1/namespaces/default/datasources/aXc/health`;

    expect(isHealthCheckUrl(url, '/api/datasources/uid/a.c/health', healthPattern('a.c'))).toBe(false);
  });
});

describe('isDataSourceSaveUrl', () => {
  const legacy = '/api/datasources/uid/abc';

  it.each([
    `${ORIGIN}/api/datasources/uid/abc`,
    `${ORIGIN}/apis/grafana-test-datasource.datasource.grafana.app/v0alpha1/namespaces/default/datasources/abc`,
  ])('matches %s', (url) => {
    expect(isDataSourceSaveUrl(url, legacy, savePattern('abc'))).toBe(true);
  });

  it.each([
    `${ORIGIN}/apis/grafana-test-datasource.datasource.grafana.app/v0alpha1/namespaces/default/datasources/other`,
    `${ORIGIN}/apis/grafana-test-datasource.datasource.grafana.app/v0alpha1/namespaces/default/datasources/abc/health`,
    `${ORIGIN}/apis/dashboard.grafana.app/v1/namespaces/default/datasources/abc`,
  ])('does not match %s', (url) => {
    expect(isDataSourceSaveUrl(url, legacy, savePattern('abc'))).toBe(false);
  });
});
