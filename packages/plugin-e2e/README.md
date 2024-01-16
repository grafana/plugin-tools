# Grafana / Plugin E2E

E2E test Grafana plugins with ease.

## Overview

`@grafana/plugin-e2e` is designed specifically for Grafana plugin developers. It extends [Playwright test](https://github.com/microsoft/playwright/) capabilities with fixtures, models, and expect matchers, enabling comprehensive end-to-end testing of Grafana plugins across multiple versions of Grafana. This package simplifies the testing process, ensuring your plugin is robust and compatible with various Grafana environments.

## Features

- **Predefined Fixtures:** Offers a set of predefined fixtures that are tailored for Grafana plugin testing.
- **Custom Models:** Provides custom models that represent different aspects of Grafana, making it easier to interact with the Grafana UI in tests.
- **Expect Matchers:** Includes a range of expect matchers that are specialized for Grafana plugin assertions, helping you validate plugin behavior more effectively.
- **Version Compatibility:** Ensures that your plugin is tested across multiple versions of Grafana, guaranteeing compatibility and stability.
- **Integration with Playwright:** Seamlessly integrates with the Playwright testing framework, leveraging its powerful browser automation capabilities.

## Getting Started

### Prerequisites

- Node.js 18+
- Basic knowledge of Playwright
- Grafana plugin [development environment](https://grafana.com/developers/plugin-tools/get-started/set-up-development-environment)

### Installation

To install `@grafana/plugin-e2e`, run the following command in your project directory:

```bash
npm install @grafana/plugin-e2e@latest --save-dev
```

To install Playwright along with the default browsers:

```bash
npm init playwright@latest
```

> Note: @grafana/plugin-e2e uses @playwright/test version 1.40.0 internally, so the version you install in the plugin needs to be the same or higher.

## Usage

### Writing Tests

Here's a basic example of how to write an E2E test using `@grafana/plugin-e2e`:

```typescript
import { expect, test } from '@grafana/plugin-e2e';

test('query data request should return 200 when query is valid', async ({ panelEditPage }) => {
  await panelEditPage.datasource.set('gdev-testdata');
  const queryEditorRow = await panelEditPage.getQueryEditorRow('A');
  await queryEditorRow.getByLabel('Labels').fill('key=value1, key2=value3');
  await expect(panelEditPage.refreshPanel()).toBeOK();
});
```

### Running Tests

To run your tests, use the following command:

```bash
npx playwright test
```

# Contributing

We welcome contributions to @grafana/plugin-e2e. If you're interested in contributing, please read our [contributing guidelines](./CONTRIBUTING.md).
