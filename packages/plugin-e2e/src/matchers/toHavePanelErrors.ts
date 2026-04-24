import { DashboardPage } from '../models/pages/DashboardPage';

/**
 * @alpha - the API is not yet stable and may change without a major version bump. Use with caution.
 */
export const toHavePanelErrors = async (dashboard: DashboardPage, expectedCount?: number) => {
  const errorLocator = dashboard.getByGrafanaSelector(dashboard.ctx.selectors.components.Panels.Panel.status('error'));
  const count = await errorLocator.count();
  const pass = expectedCount === undefined ? count >= 1 : count === expectedCount;

  return {
    pass,
    message: () =>
      expectedCount === undefined
        ? `Expected at least 1 panel with errors but found ${count}`
        : `Expected exactly ${expectedCount} panel error(s) but found ${count}`,
  };
};
