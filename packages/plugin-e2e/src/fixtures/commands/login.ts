import path from 'path';
import { expect, TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../types';
import { PlaywrightCombinedArgs } from '../types';

const authFile = 'playwright/.auth/user.json';

type LoginFixture = TestFixture<() => Promise<void>, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

const ADMIN_USER = { user: 'admin', password: 'admin' };

export const login: LoginFixture = async ({ request, user }, use) => {
  await use(async () => {
    const data = user ?? ADMIN_USER;
    const loginReq = await request.post('/login', { data });
    const text = await loginReq.text();
    expect.soft(loginReq.ok(), `Could not log in to Grafana: ${text}`).toBeTruthy();
    await request.storageState({ path: path.join(process.cwd(), `playwright/.auth/${data.user}.json`) });
  });
};
