```yaml title=".github/workflows/e2e.yml"
name: E2E tests
on:
  pull_request:
  schedule:
    - cron: '0 11 * * *' #Run e2e tests once a day at 11 UTC

permissions:
  contents: read
  id-token: write

jobs:
  resolve-versions:
    name: Resolve Grafana images
    runs-on: ubuntu-latest
    timeout-minutes: 3
    outputs:
      matrix: ${{ steps.resolve-versions.outputs.matrix }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Resolve Grafana E2E versions
        id: resolve-versions
        uses: grafana/plugin-actions/e2e-version@main

  playwright-tests:
    needs: resolve-versions
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        GRAFANA_IMAGE: ${{fromJson(needs.resolve-versions.outputs.matrix)}}
    name: e2e ${{ matrix.GRAFANA_IMAGE.name }}@${{ matrix.GRAFANA_IMAGE.VERSION }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3

      - name: Setup Node.js environment
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      - name: Install pnpm dependencies
        run: pnpm install --frozen-lockfile

      - name: Build frontend
        run: pnpm run build

      - name: Install Playwright Browsers
        run: pnpm playwright install --with-deps

      - name: Start Grafana
        run: |
          docker compose pull
          GRAFANA_VERSION=${{ matrix.GRAFANA_IMAGE.VERSION }} GRAFANA_IMAGE=${{ matrix.GRAFANA_IMAGE.NAME }} docker compose up -d

      - name: Wait for grafana server
        uses: grafana/plugin-actions/wait-for-grafana@main

      - name: Run Playwright tests
        id: run-tests
        run: pnpm playwright test
```
