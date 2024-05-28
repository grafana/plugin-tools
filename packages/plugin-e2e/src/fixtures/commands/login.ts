import path from 'path';
import { expect, TestFixture } from '@playwright/test';
import { PlaywrightArgs, User } from '../../types';

type LoginFixture = TestFixture<() => Promise<void>, PlaywrightArgs>;

export const DEFAULT_ADMIN_USER: User = { user: 'admin', password: 'admin' };

export const login: LoginFixture = async ({ request, user }, use) => {
  await use(async () => {
    const data = user ?? DEFAULT_ADMIN_USER;
    const loginReq = await request.post('/login', { data });
    const text = await loginReq.text();
    expect.soft(loginReq.ok(), `Could not log in to Grafana: ${text}`).toBeTruthy();
    await request.storageState({ path: path.join(process.cwd(), `playwright/.auth/${data.user}.json`) });
  });
};
