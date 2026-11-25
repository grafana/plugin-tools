import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { MIN_GRAFANA_VERSION } from '../../selectors/minGrafanaVersion';
import { versionedAPIs } from '../../selectors/versionedAPIs';
import { PluginTestCtx } from '../../types';

type RouteMatcher = string | ((url: URL) => boolean);

describe('GrafanaPage.mockQueryDataResponse', () => {
  async function getRouteMatchers() {
    const matchers: RouteMatcher[] = [];
    const { DataSource } = versionedAPIs;
    const ctx = {
      page: { route: vi.fn(async (matcher: RouteMatcher) => void matchers.push(matcher)) },
      selectors: {
        apis: {
          DataSource: {
            queryPattern: DataSource.queryPattern[MIN_GRAFANA_VERSION],
            appPlatformQueryPattern: DataSource.appPlatformQueryPattern[MIN_GRAFANA_VERSION],
          },
        },
      },
    } as unknown as PluginTestCtx;

    await new DashboardPage(ctx).mockQueryDataResponse({});
    return matchers;
  }

  it.each([
    'http://localhost:3000/apis/query.grafana.app/v0alpha1/namespaces/default/query',
    'http://localhost:3000/apis/query.grafana.app/v0alpha1/namespaces/default/query?ds_type=prometheus',
    'http://localhost:3000/apis/datasource.grafana.app/v0alpha1/namespaces/default/query?expression=true&ds_type=prometheus',
  ])('mocks the query apiserver request %s', async (url) => {
    const [, appPlatformMatcher] = await getRouteMatchers();

    expect(typeof appPlatformMatcher).toBe('function');
    expect((appPlatformMatcher as (url: URL) => boolean)(new URL(url))).toBe(true);
  });

  it('does not mock other query apiserver requests', async () => {
    const [, appPlatformMatcher] = await getRouteMatchers();
    const url = new URL('http://localhost:3000/apis/query.grafana.app/v0alpha1/namespaces/default/querytemplates');

    expect((appPlatformMatcher as (url: URL) => boolean)(url)).toBe(false);
  });
});
