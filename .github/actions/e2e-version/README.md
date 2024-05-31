# E2E Grafana version resolver

This Action resolves what Grafana image names and versions to use when E2E testing a Grafana plugin in a Github Action.

## Inputs

### `skip-grafana-dev-image`

By default, this actions resolves an image for the latest build of the main branch in Grafana. If you don't want to include the `grafana-dev` image in your test matrix, you can opt-out on it by setting the `skip-grafana-dev-image` to `true`.

### `version-resolver-type`

The action supports two modes.

**plugin-grafana-dependency (default)**
The will return the most recent grafana-dev image and all the latest patch release of every minor version of Grafana Enterprise that satisfies the range specified in the [dependencies.grafanaDependency](https://grafana.com/developers/plugin-tools/reference/plugin-json#properties-1) property in plugin.json. This requires the plugin.json file to be placed in the `<root>/src` directory. To avoid starting too many jobs, to output will be capped 6 versions.

### Example

At the time of writing, the most recent release of Grafana is 10.3.1. If the plugin has specified >=8.0.0 as `grafanaDependency` in the plugin.json file, the output would be:

```json
[
  {
    "name": "grafana-dev",
    "version": "10.4.0-157931"
  },
  {
    "name": "grafana-enterprise",
    "version": "10.3.1"
  },
  {
    "name": "grafana-enterprise",
    "version": "10.0.10"
  },
  {
    "name": "grafana-enterprise",
    "version": "9.2.20"
  },
  {
    "name": "grafana-enterprise",
    "version": "8.4.11"
  },
  {
    "name": "grafana-enterprise",
    "version": "8.1.8"
  }
]
```

Please note that the output changes as new versions of Grafana are being released.

**version-support-policy**
Except for resolving the most recent grafana-dev image, this will resolve versions according to Grafana's plugin compatibility support policy. Specifically, it retrieves the latest patch release for each minor version within the current major version of Grafana. Additionally, it includes the most recent release for the latest minor version of the previous major Grafana version.```

### Example

At the time of writing, the most recent release of Grafana is 10.2.2. The output for `version-support-policy` would be:

```json
[
  {
    "name": "grafana-dev",
    "version": "10.4.0-157931"
  },
  {
    "name": "grafana-enterprise",
    "version": "10.3.1"
  },
  {
    "name": "grafana-enterprise",
    "version": "10.2.3"
  },
  {
    "name": "grafana-enterprise",
    "version": "10.1.6"
  },
  {
    "name": "grafana-enterprise",
    "version": "10.0.10"
  },
  {
    "name": "grafana-enterprise",
    "version": "9.5.15"
  }
]
```

### Output

The result of this action is a JSON array that lists the latest patch version for each Grafana minor version. These values can be employed to define a version matrix in a subsequent workflow job.

## Workflow example

### plugin-grafana-dependency

```yaml
name: E2E tests - Playwright
on:
  pull_request:

jobs:
  resolve-versions:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.resolve-versions.outputs.matrix }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Resolve Grafana E2E versions
        id: resolve-versions
        uses: grafana/plugin-actions/e2e-version
        with:
          # target all minor versions of Grafana that have been released since the version that was specified as grafanaDependency in the plugin
          version-resolver-type: plugin-grafana-dependency

  playwright-tests:
    needs: resolve-versions
    strategy:
      matrix:
        # use matrix from output in previous job
        GRAFANA_IMAGE: ${{fromJson(needs.resolve-versions.outputs.matrix)}}
    runs-on: ubuntu-latest
    steps:
      ...
      - name: Start Grafana
        run: |
          docker-compose pull
          GRAFANA_VERSION=${{ matrix.GRAFANA_IMAGE.VERSION }} GRAFANA_IMAGE=${{ matrix.GRAFANA_IMAGE.NAME }} docker-compose up -d
      ...
```

### version-support-policy

```yaml
name: E2E tests - Playwright
on:
  pull_request:

jobs:
  resolve-versions:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.resolve-versions.outputs.matrix }}
    steps:
      - name: Resolve Grafana E2E versions
        id: resolve-versions
        uses: grafana/plugin-actions/e2e-version
        with:
          #target all minors for the current major version of Grafana and the last minor of the previous major version of Grafana
          version-resolver-type: version-support-policy

  playwright-tests:
    needs: resolve-versions
    strategy:
      matrix:
        # use matrix from output in previous job
        GRAFANA_IMAGE: ${{fromJson(needs.resolve-versions.outputs.matrix)}}
    runs-on: ubuntu-latest
    steps:
      ...
      - name: Start Grafana
        run: |
          docker-compose pull
          GRAFANA_VERSION=${{ matrix.GRAFANA_IMAGE.VERSION }} GRAFANA_IMAGE=${{ matrix.GRAFANA_IMAGE.NAME }} docker-compose up -d
      ...
```

## Development

```bash
cd e2e-versions
npm i

#before pushing to main
npm run bundle
```

### `grafana-dependency`

When using the `plugin-grafana-dependency` resolver type, you can optionally use the `grafana-dependency` input to pass a semver range of supported Grafana versions to test against. If this input is provided, the [dependencies.grafanaDependency](https://grafana.com/developers/plugin-tools/reference/plugin-json#properties-1) property in plugin.json will be ignored.
