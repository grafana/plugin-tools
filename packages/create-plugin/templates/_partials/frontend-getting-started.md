### Frontend

1. Install dependencies

   ```bash
   {{ packageManagerName }} install
   ```

2. Build plugin in development mode and run in watch mode

   ```bash
   {{ packageManagerName }} run dev
   ```

3. Build plugin in production mode

   ```bash
   {{ packageManagerName }} run build
   ```

4. Run the tests (using Jest)

   ```bash
   # Runs the tests and watches for changes, requires git init first
   {{ packageManagerName }} run test

   # Exits after running all the tests
   {{ packageManagerName }} run test:ci
   ```

5. Spin up a Grafana instance and run the plugin inside it (using Docker)

   ```bash
   {{ packageManagerName }} run server
   ```

6. Run the E2E tests (using Cypress)

   ```bash
   # Spins up a Grafana instance first that we tests against
   {{ packageManagerName }} run server

   # Starts the tests
   {{ packageManagerName }} run e2e
   ```

7. Run the linter

   ```bash
   {{ packageManagerName }} run lint

   # or

   {{ packageManagerName }} run lint:fix
   ```
