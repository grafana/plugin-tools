```yaml title=".github/workflows/e2e.yml"
name: E2E tests
on:
  pull_request:

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
          docker-compose pull
          GRAFANA_VERSION=${{ matrix.GRAFANA_IMAGE.VERSION }} GRAFANA_IMAGE=${{ matrix.GRAFANA_IMAGE.NAME }} docker-compose up -d

      - name: Wait for Grafana to start
        uses: nev7n/wait_for_response@v1
        with:
          url: 'http://localhost:3000/'
          responseCode: 200
          timeout: 60000
          interval: 500

      - name: Run Playwright tests
        id: run-tests
        run: pnpm playwright test

      # Uncomment this step to upload the Playwright report to Github artifacts.
      # If your repository is public, the report will be public on the Internet so beware not to expose sensitive information.
      # - name: Upload artifacts
      #   uses: actions/upload-artifact@v4
      #   if: ${{ (always() && steps.run-tests.outcome == 'success') || (failure() && steps.run-tests.outcome == 'failure') }}
      #   with:
      #     name: playwright-report-${{ matrix.GRAFANA_IMAGE.NAME }}-v${{ matrix.GRAFANA_IMAGE.VERSION }}-${{github.run_id}}
      #     path: playwright-report/
      #     retention-days: 30
```
