import path from 'path';
import { TestFixture, expect } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { GrafanaAPIClient } from '../models/GrafanaAPIClient';

type GrafanaAPIClientFixture = TestFixture<GrafanaAPIClient, PlaywrightArgs>;

export const grafanaAPIClient: GrafanaAPIClientFixture = async ({ grafanaAPICredentials, browser }, use, testInfo) => {
  const context = await browser.newContext({ storageState: undefined });
  const fileName = path.join(process.cwd(), `playwright/.auth/grafanaAPICredentials.json`);

  //   if (!fs.existsSync(fileName)) {
  const loginReq = await context.request.post('/login', { data: grafanaAPICredentials });
  const text = await loginReq.text();
  await expect.soft(loginReq.ok(), `Could not log in to Grafana: ${text}`).toBeTruthy();
  //   }

  const a = await context.request.storageState({ path: fileName });
  await use(new GrafanaAPIClient(context.request));
};
