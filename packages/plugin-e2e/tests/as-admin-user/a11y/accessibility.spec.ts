import { test, expect } from '../../../src';

test.describe('scanForA11yViolations', () => {
  test('runs a11y audit against a basic page', async ({
    selectors,
    gotoDashboardPage,
    readProvisionedDashboard,
    scanForA11yViolations,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
    const dashboardPage = await gotoDashboardPage({ ...dashboard });
    await expect(dashboardPage.getPanelByTitle('Table data').locator).toBeVisible();
    await expect(dashboardPage.getByGrafanaSelector(selectors.components.LoadingIndicator.icon)).not.toBeVisible();

    const report = await scanForA11yViolations();
    expect(report).toHaveNoA11yViolations({
      // this is the complete list of a11y violations on this page today for the spread of versions we test.
      // maybe we want to do something more flake-proof here, but I do like that this test confirms that
      // violations are actually being detected with the default configuration.
      ignoredRules: ['label', 'list', 'listitem', 'page-has-heading-one', 'aria-command-name', 'aria-prohibited-attr'],
    });
  });

  // this test assumes that there are no contrast issues on the default dashboard page to begin with.
  test('runs a11y audit with custom options for a basic page', async ({
    page,
    selectors,
    gotoDashboardPage,
    readProvisionedDashboard,
    scanForA11yViolations,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
    const dashboardPage = await gotoDashboardPage({ ...dashboard });
    await expect(dashboardPage.getPanelByTitle('Table data').locator).toBeVisible();
    await expect(dashboardPage.getByGrafanaSelector(selectors.components.LoadingIndicator.icon)).not.toBeVisible();

    const report1 = await scanForA11yViolations({ runOnly: ['color-contrast'] });
    expect(report1, 'sanity check that dashboard page has no contrast issues to begin with').toHaveNoA11yViolations();

    await page.evaluate(() => {
      const newDiv = document.createElement('div');
      newDiv.id = 'playwright-inserted-element';
      newDiv.textContent = 'Hello world!';
      newDiv.style.position = 'fixed'; // fixed position to ensure it is visible
      newDiv.style.zIndex = '99999'; // very high z-index to ensure it is on top of other elements
      newDiv.style.top = window.innerHeight / 2 + 'px'; // vertically centered
      newDiv.style.left = window.innerWidth / 2 + 'px'; // horizontally centered
      newDiv.style.background = 'rgb(20, 20, 20)'; // dark gray background
      newDiv.style.color = 'rgb(10, 10, 10)'; // dark gray text on dark gray background to create a contrast issue
      const insertRoot = document.body.querySelector('#root') || document.body; // try to insert within the root element if it exists, otherwise fall back to body
      insertRoot.appendChild(newDiv); // insert at the beginning of the body to ensure it's visible
    });

    await expect(page.locator('#playwright-inserted-element')).toBeVisible();
    const report2 = await scanForA11yViolations({ runOnly: ['color-contrast'] });
    expect(report2, 'intentionally inserted contrast issue was flagged').not.toHaveNoA11yViolations();

    expect(report2, 'ignoring the rule passes the assertion').toHaveNoA11yViolations({
      ignoredRules: ['color-contrast'],
    });
    expect(report2, 'ignoring a different rule fails the assertion').not.toHaveNoA11yViolations({
      ignoredRules: ['region'],
    });
    expect(report2, 'threshold of 0 fails the assertion').not.toHaveNoA11yViolations({
      threshold: 0,
    });
    expect(report2, 'threshold of 1 passes the assertion').toHaveNoA11yViolations({
      threshold: 1,
    });
  });
});
