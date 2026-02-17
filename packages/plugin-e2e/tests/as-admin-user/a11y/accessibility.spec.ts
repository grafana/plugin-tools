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
      // write two strings into the document, one white, one black. Depending on the current theme, at least one should
      // trigger a contrast issue.
      for (const color of ['rgb(0, 0, 0)', 'rgb(255, 255, 255)']) {
        const newDiv = document.createElement('div');
        newDiv.id = 'playwright-inserted-element';
        newDiv.textContent = 'Hello world!';
        newDiv.style.color = color; // black text on black background to create a contrast issue
        document.body.prepend(newDiv); // insert at the beginning of the body to ensure it's visible
      }
    });

    await page.waitForSelector('#playwright-inserted-element');
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
