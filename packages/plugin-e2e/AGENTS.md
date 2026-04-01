# plugin-e2e

`@grafana/plugin-e2e` extends [Playwright Test](https://playwright.dev/) with Grafana-specific fixtures, page object models and custom matchers. Plugin developers use it to write end-to-end tests that run against multiple Grafana versions (9.5+). The package supports app plugins, data source plugins and panel plugins.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for folder structure and development setup.

## Commands

In addition to the standard workspace commands in the root AGENTS.md, this package has:

```shell
# start a local Grafana instance for running tests
npm run server -w @grafana/plugin-e2e
GRAFANA_VERSION=11.2.1 npm run server -w @grafana/plugin-e2e  # specific version

# run the Playwright test suite
npm run playwright:test -w @grafana/plugin-e2e
```

## Public API

The full public API is defined in `src/index.ts`. The package exports four main categories:

- **Fixtures** - Playwright context providers that expose page models and Grafana utilities. Two patterns:
  - _Camel case_ (e.g. `variableEditPage`, `panelEditPage`) — starts the test with an empty page instance, useful for create/edit flows.
  - _`goto` prefix_ (e.g. `gotoAnnotationEditPage`, `gotoDashboardPage`) — navigates to an already-existing resource by UID or ID, useful for testing against provisioned data.

  Other fixtures cover utilities (`grafanaAPIClient`, `grafanaVersion`, `selectors`, `bootData`) and commands (`login`, `createDataSource`, `readProvisionedDataSource`, etc.). See `src/types.ts` for the full list.

- **Page models** - classes in `src/models/pages/`, all extending `GrafanaPage`. Encapsulate UI interactions and abstract away version differences.
- **Component models** - classes in `src/models/components/`, all extending `ComponentBase`. Wrap a Playwright `Locator` with domain-specific methods (e.g. `Select`, `Switch`, `ColorPicker`).
- **Matchers** - custom `expect()` extensions in `src/matchers/` for Grafana-specific assertions (e.g. `toHaveAlert`, `toHaveSelected`, `toHaveNoA11yViolations`).

## Patterns and conventions

- The package targets Grafana 9.5+ as its minimum supported version, but you only need to support versions where the underlying Grafana feature actually exists. Use `semver` to branch when behaviour differs:

  ```typescript
  import { gte } from 'semver';
  if (gte(this.ctx.grafanaVersion, '10.4.0')) {
    // newer flow
  } else {
    // legacy flow
  }
  ```

- Always use selectors defined in the `@grafana/e2e-selectors` package. If the selector you need doesn't exist there, add it to that package first.
- Never import `@grafana/e2e-selectors` directly. Always use the `selectors` fixture - it resolves version-specific selectors at runtime.
- Always locate elements via `getByGrafanaSelector(selectors.components.Foo.bar)`. See the [selecting elements guide](https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/selecting-elements#grafana-end-to-end-selectors) for usage.
- If a magic string is unavoidable (e.g. a selector not suited for `@grafana/e2e-selectors`), define it in `src/selectors/versionedConstants.ts` so it can be made version-specific.
- API paths are not part of `@grafana/e2e-selectors` - define them in `src/selectors/versionedAPIs.ts` instead.

## Testing changes

Every feature in this package must be covered by a Playwright test in `tests/`. Look at existing tests there for conventions and patterns. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full process. In short: run `npm run playwright:test -w @grafana/plugin-e2e` locally, then open a draft PR — CI will run the full Grafana version matrix.
