import * as semver from 'semver';
import { expect, test } from '../../../src';

test.describe.configure({ mode: 'parallel' });

// smoke-test-dashboard has 10 panels in 5 rows:
// row 1 (y=0):  "Top Left",    "Top Right"    — in viewport at all tested resolutions
// row 2 (y=8):  "Middle Left", "Middle Right" — partially in viewport at 1280x720
// row 3 (y=16): "Lower Left",  "Lower Right"  — below fold at 1280x720
// row 4 (y=24): "Deep Left",   "Deep Right"   — below fold at 1280x720
// row 5 (y=40): "Bottom Left", "Bottom Right" — below fold at all tested resolutions (including 1920x1080)
test.describe('dashboard smoke tests', () => {
  test('all visible panels complete without errors', async ({ gotoDashboardPage }) => {
    const dashboard = await gotoDashboardPage({ uid: 'smoke-test-dashboard' });
    await dashboard.waitForPanelsQueriesToComplete();
    await expect(dashboard).not.toHavePanelErrors();
  });

  test('scrollAll triggers below-fold panels and all complete without errors', async ({ gotoDashboardPage }) => {
    const dashboard = await gotoDashboardPage({ uid: 'smoke-test-dashboard' });
    await dashboard.waitForPanelsQueriesToComplete({ scrollAll: true });
    await expect(dashboard).not.toHavePanelErrors();
  });

  test('scrollAll reaches below-fold panels — bottom row receives query responses', async ({
    gotoDashboardPage,
    grafanaVersion,
  }) => {
    // the scroll mechanism relies on document.documentElement.scrollTop which behaves
    // differently in pre-scenes Grafana — skip the viewport assertions on older versions
    test.skip(semver.lt(grafanaVersion, '9.5.0'), 'viewport-based scroll not supported in this Grafana version');

    const dashboard = await gotoDashboardPage({ uid: 'smoke-test-dashboard' });

    // without scrollAll the bottom row panels are not in viewport and their
    // queries have not fired yet — verify they have no data rendered
    const bottomLeft = dashboard.getPanelByTitle('Bottom Left');
    await expect(bottomLeft.locator).not.toBeInViewport();

    // scrollAll scrolls the full page so bottom row queries are also captured
    await dashboard.waitForPanelsQueriesToComplete({ scrollAll: true });
    await expect(dashboard).not.toHavePanelErrors();

    // after scrollAll the bottom panels have been scrolled into view
    await expect(bottomLeft.locator).toBeInViewport();
  });

  test('manually scrolling a below-fold panel into view triggers its query', async ({ gotoDashboardPage }) => {
    const dashboard = await gotoDashboardPage({ uid: 'smoke-test-dashboard' });

    // "Lower Right" (y=16) is always in the DOM but below the fold at 1280x720 —
    // use it here because y=40 panels are lazy-rendered and not yet in the DOM
    const lowerRight = dashboard.getPanelByTitle('Lower Right');
    await lowerRight.scrollIntoView();
    await expect(lowerRight.locator).toBeInViewport();

    await dashboard.waitForPanelsQueriesToComplete();
    await expect(dashboard).not.toHavePanelErrors();
  });

  test('toHavePanelErrors detects the correct number of panel errors', async ({ gotoDashboardPage }) => {
    // the smoke-test-dashboard uses a healthy data source — zero errors expected
    const dashboard = await gotoDashboardPage({ uid: 'smoke-test-dashboard' });
    await dashboard.waitForPanelsQueriesToComplete({ scrollAll: true });

    await expect(dashboard).not.toHavePanelErrors();
    await expect(dashboard).toHavePanelErrors(0);
  });
});
