### Backend

1. Update [Grafana plugin SDK for Go](https://grafana.com/developers/plugin-tools/key-concepts/backend-plugins/grafana-plugin-sdk-for-go) dependency to the latest minor version:

   ```bash
   go get -u github.com/grafana/grafana-plugin-sdk-go
   go mod tidy
   ```

2. Build plugin backend binaries for Linux, Windows and Darwin:

   ```bash
   mage -v
   ```

3. Build plugin backend binaries in debug when files change:
   ```bash
   mage watch
   ```

4. Run backend tests:
   ```bash
   mage test
   ```

5. Run the linter:
   ```bash
   mage lint
   ```

6. List all available Mage targets for additional commands:

   ```bash
   mage -l
   ```