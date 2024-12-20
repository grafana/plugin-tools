# Contributing to Grafana / Plugin E2E

We are always grateful to receive contributions!<br />
The following guidelines help you on how to start with the codebase and how to submit your work.

### Prerequisites

You need to have `npm` installed.

### Installing

```bash
git clone git@github.com:grafana/plugin-tools.git
cd plugin-tools
npm install

#Each version of Playwright needs specific versions of browser binaries to operate. You will need to use the Playwright CLI to install these browsers.
npx playwright install
```

### Folder structure

The plugin-e2e workspace consists of the following folder structure:

```js
./packages/plugin-e2e
├── provisioning // Dashboards and data sources used to provision Grafana when running E2E tests in CI and locally
├── dist // Generated code and typescript definition files which constitutes the npm package
├── src //
│   ├── fixtures // Grafana specific Playwright fixtures
│   │   └── commands // Fixtures that need to be invoked by the consumer
│   ├── matchers // Grafana specific Playwright expect matchers
│   └── models // Page object models for Grafana pages
└── tests // Contains Playwright tests that eases development and verifies that fixtures, models and expect matchers work as expected. these tests are not part of the npm package.
    ├── datasource // Data source plugin specific Playwright tests
    └── panel // Panel plugin specific tests
```

## Development

There are a collection of [commands](#commands) to assist with developing `plugin-e2e`. Please read the main [contributing guide](../../CONTRIBUTING.md) before contributing any code changes to the project.

### Commands

Below are the main commands used for developing `plugin-e2e`. They can be run by either `npx nx run @grafana/plugin-e2e:<name_of_command>`, `npm run <name_of_command> -w @grafana/plugin-e2e` or navigating to `packages/plugin-e2e` and running the command directly as detailed below.

```shell
npm run build # used to build @grafana/plugin-e2e
```

```shell
npm run dev # watches for changes to files and rebuilds @grafana/plugin-e2e automatically
```

### Tests

The [tests](./tests/) folder contains a suite of Playwright tests designed to validate that the plugin-e2e APIs work as expected. These tests run continuously for every PR in the plugin-tools repository to identify potential breakages in the plugin-e2e package. Since all plugin-e2e APIs must remain compatible with Grafana 9.5 and later, the tests are executed against a matrix of Grafana versions. The test environment is configured using the docker-compose file in this workspace, which installs a set of plugins to ensure comprehensive coverage of the plugin-e2e APIs throughout the test suite.

To run the tests locally:

1. Start the Grafana e2e instance:

```shell
# starts the test server using the main branch of Grafana
npm run server
# if you want to test a specific version of Grafana
GRAFANA_VERSION=11.2.1 npm run server
```

2. Run the tests

```shell
npm run playwright:test # runs all the playwright
```

### The [Test DataSource](https://github.com/grafana/grafana-test-datasource)

Many of the Playwright tests in the [test suite](./tests/) use a custom made data source plugin. This data source it not published to the catalog - its only purpose is to verify that the plugin-e2e APIs work as expected. If you need to change the functionality of this plugin, refer to the [plugin readme](https://github.com/grafana/grafana-test-datasource?tab=readme-ov-file#distributing-changes-in-the-plugin).

### VS Code Playwright extension

If you're using VS Code as your development editor, it's recommended to install the [Playwright test extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright). It allows you to run, debug and generate Playwright tests from within the editor. For more information about the extension and how to install it, refer to the [Playwright documentation](https://playwright.dev/docs/getting-started-vscode).

## How to fix broken test scenarios after changes in Grafana

If you find that fixtures, models or expect matchers provided by @grafana/plugin-e2e are no longer working, it's likely because the Grafana UI has been changed.

A few examples of changes in the Grafana UI that can break functionality in @grafana/plugin-e2e:

- a selector has been renamed (you should never do this)
- the sequence of user interactions needed to reach a certain state has changed
- a Grafana api url has been changed

If for example the UI for adding a panel to a dashboard is being changed completely in Grafana 10.4.0, you may need to add logic to handle that in the [DashboardPage.addPanel](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-e2e/src/models/DashboardPage.ts#L38-L55) method.

```typescript
// DashboardPage.addPanel method
if (gte(this.ctx.grafanaVersion, '10.4.0')) {
  // logic that ensures adding new panels work in Grafana versions greater than or equals to 10.4.0
} else if (gte(this.ctx.grafanaVersion, '10.0.0')) {
  await this.getByGrafanaSelector(components.PageToolbar.itemButton(components.PageToolbar.itemButtonTitle)).click();
  await this.getByGrafanaSelector(pages.AddDashboard.itemButton(pages.AddDashboard.itemButtonAddViz)).click();
} else {
  await this.getByGrafanaSelector(pages.AddDashboard.addNewPanel).click();
}
```

Beware that scenarios provided by @grafana/plugin-e2e needs to be work in older versions of Grafana, so you need to make sure the changes you make doesn't break backwards compatibility.

### Testing your changes

1. If you need to, add a new Playwright test in [`tests`](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-e2e/tests).

2. Run Playwright tests locally - `npm run playwright:test`

3. Push the changes in your local PR, create a draft PR in [grafana/plugin-tools](https://github.com/grafana/plugin-tools/) and add the labels `release` and `minor|patch`. CI will run all Playwright tests against a set of different Grafana versions. If not all of them pass, it may be because you've introduced a change that is no longer compatible with older versions of Grafana.

4. Once CI passes, `auto` will publish a canary release to NPM. You can find the version number at the bottom of the PR description.

5. Install the pre-release of @grafana/plugin-e2e in [grafana/grafana](https://github.com/grafana/grafana) and run Playwright tests.

```bash
# In your local grafana development folder
yarn add @grafana/plugin-e2e@0.3.0-canary.623.aedff75.0
yarn e2e:plugin
```

6. If all tests pass in `grafana/grafana` and the PR in `grafana/plugin-tools` is approved, tag `@grafana/plugins-platform-frontend` and ask them to merge the PR.

7. Once the PR is merged, `auto` will publish a patch/minor release to npm. Then you discard changes from step 5, and can go ahead and install the new release of @grafana/plugin-e2e in grafana/grafana.
