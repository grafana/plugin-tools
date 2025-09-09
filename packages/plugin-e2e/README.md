# Grafana / Plugin E2E

end-to-end test Grafana plugins with ease.

**Links**

- [`@grafana/plugin-e2e` docs](https://grafana.com/developers/plugin-tools/e2e-test-a-plugin)

## Overview

`@grafana/plugin-e2e` is designed specifically for Grafana plugin developers. It extends [Playwright test](https://github.com/microsoft/playwright/) capabilities with fixtures, models, and expect matchers, enabling comprehensive end-to-end testing of Grafana plugins across multiple versions of Grafana. This package simplifies the testing process, ensuring your plugin is robust and compatible with various Grafana environments.

## Features

- **Predefined Fixtures:** Offers a set of predefined fixtures that are tailored for Grafana plugin testing.
- **Custom Models:** Provides custom models that represent pages and components in Grafana, simplifying maintenance and creating reusable code to avoid repetition.
- **Expect Matchers:** Includes a range of expect matchers that are specialized for Grafana plugin assertions, helping you validate plugin behavior more effectively.
- **Version Compatibility:** Ensures that your plugin is tested across multiple versions of Grafana, guaranteeing compatibility and stability.
- **Integration with Playwright:** Seamlessly integrates with the Playwright testing framework, leveraging its powerful browser automation capabilities.

## Get started

Checkout our [`Get started`](https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/get-started) guide for detailed instructions on how to install, configure, write tests and run your end-to-end tests in CI.

### Prerequisites

- You need to have a Grafana plugin [development environment](https://grafana.com/developers/plugin-tools/get-started/set-up/)
- Node.js 18+
- Basic Knowledge of Playwright. If you have not worked with Playwright before, we recommend following the [Getting started](https://playwright.dev/docs/intro) section in their documentation

#### Install Playwright

Please refer to the [Playwright documentation](https://playwright.dev/docs/intro#installing-playwright) for instruction on how to install. `@grafana/plugin-e2e` extends Playwright APIs, so you need to have `Playwright/test` with a minimum version of 1.41.2 installed as a dev dependency in the package.json file of your plugin.

#### Configure Playwright

Open the Playwright config file that was generated when Playwright was installed and paste the following configuration.

```ts
import { dirname } from 'path';
import { defineConfig, devices } from '@playwright/test';
import type { PluginOptions } from '@grafana/plugin-e2e';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
  testDir: './tests', // change this to the directory that was chosen when installing Playwright
  reporter: 'html',
  use: {
    baseURL: process.env.GRAFANA_URL || 'http://localhost:3000',
  },
  projects: [
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'run-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    },
  ],
});
```

### Writing Tests

Here's a basic example of how to write an end-to-end test using `@grafana/plugin-e2e`:

```ts
import { test, expect } from '@grafana/plugin-e2e';

test('data query should return values 10 and 20', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Table');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.data).toContainText(['10', '20']);
});
```

### Running Tests

To run your tests, use the following command:

```bash
npx playwright test
```

## Contributing

We welcome contributions to @grafana/plugin-e2e. If you're interested in contributing, please read our [contributing guidelines](./CONTRIBUTING.md).

### Credits

`@grafana/plugin-e2e` wouldn't be possible without [Playwright test](https://playwright.dev/). Many thanks to Microsoft and all the people contributing to this amazing tool!
