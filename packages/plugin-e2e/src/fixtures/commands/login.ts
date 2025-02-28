import path from 'path';
import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../../types';

type LoginFixture = TestFixture<() => Promise<void>, PlaywrightArgs>;

export const login: LoginFixture = async ({ request, user }, use) => {
  await use(async () => {
    const loginReq = await request.post('/login', { data: user });
    const text = await loginReq.text();
    if (!loginReq.ok()) {
      throw new Error(`Could not login to Grafana using user '${user?.user}': ${text}`);
    }
    await request.storageState({ path: path.join(process.cwd(), `playwright/.auth/${user?.user}.json`) });
  });
};
