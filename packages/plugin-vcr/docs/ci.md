# Run plugin-vcr in CI

Once replay passes locally, CI can run the same tests with no secrets. That includes pull requests from forks, which never get secrets.

> **Note**
> This setup hasn't been run in CI yet.

## Add a single compose file

The `grafana/plugin-ci-workflows` Playwright job passes one compose file with `-f`, so it can't combine `docker-compose.yaml` with the overlay the way the local scripts do. Add `docker-compose.e2e.yaml` at the plugin root that extends your Grafana service and includes the proxy:

```yaml
services:
  grafana:
    extends:
      file: docker-compose.yaml
      service: grafana
    # same depends_on, entrypoint and environment as e2e/docker-compose.vcr.yaml

  vcr:
    # same as e2e/docker-compose.vcr.yaml
```

CI has no plugin-tools checkout, so use the [preview build](./setup.md#from-a-preview-build) for the `vcr` service until the package is released.

## Point the workflow at it

```yaml
jobs:
  ci:
    uses: grafana/plugin-ci-workflows/.github/workflows/ci.yml@<version>
    with:
      run-playwright: true
      playwright-docker-compose-file: docker-compose.e2e.yaml
```

Replay is the default mode, so nothing else changes. Remove the real credentials from `playwright-secrets` once replay passes.

## Scan recordings on every build

As a backstop, scan the recordings so a commit with a leaked secret fails the build:

```shell
npx @grafana/plugin-vcr scan --har e2e/recordings/api.har
```
