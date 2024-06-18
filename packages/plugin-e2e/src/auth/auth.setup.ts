import path from 'path';
import { expect } from '@playwright/test';
import { test as setup } from '../';
import { DEFAULT_ADMIN_USER } from '../options';
import { GrafanaAPIClient } from '../models/GrafanaAPIClient';

setup('authenticate', async ({ login, createUser, user, grafanaAPICredentials, browser }) => {
  const context = await browser.newContext({ storageState: undefined });
  const loginReq = await context.request.post('/login', { data: grafanaAPICredentials });
  const text = await loginReq.text();
  expect.soft(loginReq.ok(), `Could not log in to Grafana: ${text}`).toBeTruthy();
  await context.request.storageState({ path: path.join(process.cwd(), `playwright/.auth/grafanaAPICredentials.json`) });
  const grafanaAPIClient = new GrafanaAPIClient(
    context.request,
    path.join(process.cwd(), `playwright/.auth/grafanaAPICredentials.json`)
  );
  await grafanaAPIClient.init();

  if (user && (user.user !== DEFAULT_ADMIN_USER.user || user.password !== DEFAULT_ADMIN_USER.password)) {
    await grafanaAPIClient.createUser(user);
    // await createUser();
  }
  await login();
});
