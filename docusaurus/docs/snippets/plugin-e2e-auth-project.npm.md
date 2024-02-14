```ts title="playwright.config.ts"
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    ...
    projects: [
    {
      name: 'auth',
      testDir: `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`,
      testMatch: [/.*\.js/],
    },
    {
      name: 'run-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['auth'],
    }
  ],
});
```
