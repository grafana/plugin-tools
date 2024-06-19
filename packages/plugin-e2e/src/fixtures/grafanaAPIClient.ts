import path from 'path';
import { TestFixture, expect, APIRequestContext } from '@playwright/test';
import { PlaywrightArgs, User } from '../types';
import { GrafanaAPIClient } from '../models/GrafanaAPIClient';

type GrafanaAPIClientFixture = TestFixture<GrafanaAPIClient, PlaywrightArgs>;

const adminClientStorageState = path.join(process.cwd(), `playwright/.auth/grafanaAPICredentials.json`);

export const createAdminClientStorageState = async (request: APIRequestContext, grafanaAPICredentials: User) => {
  const loginReq = await request.post('/login', { data: grafanaAPICredentials });
  const text = await loginReq.text();
  await expect.soft(loginReq.ok(), `Could not log in to Grafana: ${text}`).toBeTruthy();
  await request.storageState({ path: adminClientStorageState });
};

export const grafanaAPIClient: GrafanaAPIClientFixture = async ({ browser }, use) => {
  const context = await browser.newContext({ storageState: undefined });
  await context.request.storageState({ path: adminClientStorageState });
  await use(new GrafanaAPIClient(context.request));
};
