import { test, expect } from './fixtures';
import { URLS } from '../src/constants';

test.describe('navigating app', () => {
  test('page Hello World should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${URLS.HelloWorld}`);
    await expect(page.getByText('Hello world panel')).toBeVisible();
  });

  test('page With Tabs should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${URLS.WithTabs}`);
    await expect(page.getByText('This scene showcases a basic tabs functionality.')).toBeVisible();
  });

  test('page Home should support an id parameter', async ({ gotoPage, page }) => {
    await gotoPage(`/${URLS.Home}`);
    await expect(
      page.getByText(
        'This scene showcases a basic scene functionality, including query runner, variable and a custom scene object.'
      )
    ).toBeVisible();
  });

  test('page With Drilldown should render sucessfully', async ({ gotoPage, page }) => {
    // wait for page to successfully render
    await gotoPage(`/${URLS.WithDrilldown}`);
    await expect(
      page.getByText(
        'This scene showcases a basic drilldown functionality. Interact with room to see room details scene.'
      )
    ).toBeVisible();
  });
});
