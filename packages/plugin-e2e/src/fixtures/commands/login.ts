import path from 'path';
import { expect, TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../../types';

type LoginFixture = TestFixture<() => Promise<void>, PlaywrightArgs>;

export const login: LoginFixture = async ({ request, user }, use) => {
  await use(async () => {
    const loginReq = await request.post('/login', { data: user });
    const text = await loginReq.text();
    expect.soft(loginReq.ok(), `Could not log in to Grafana: ${text}`).toBeTruthy();
    await request.storageState({ path: path.join(process.cwd(), `playwright/.auth/${user?.user}.json`) });
  });
};
