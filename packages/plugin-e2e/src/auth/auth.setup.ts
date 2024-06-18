import { test as setup } from '../';
import { createAdminClientStorageState } from '../fixtures/grafanaAPIClient';
import { GrafanaAPIClient } from '../models/GrafanaAPIClient';

setup('authenticate', async ({ login, user, grafanaAPICredentials, browser }) => {
  const context = await browser.newContext();
  await createAdminClientStorageState(context.request, grafanaAPICredentials);
  const adminClient = new GrafanaAPIClient(context.request, grafanaAPICredentials);

  // there's no need to create the server admin user
  if (user && (user.user !== grafanaAPICredentials.user || user.password !== grafanaAPICredentials.password)) {
    await adminClient.createUser(user);
  }
  await login();
});
