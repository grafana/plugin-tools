import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../../types';

type CreateUserFixture = TestFixture<() => Promise<void>, PlaywrightArgs>;

export const createUser: CreateUserFixture = async ({ grafanaAPIClient, user }, use) => {
  await use(async () => {
    if (!user) {
      throw new Error('Playwright option `User` was not provided');
    }
    await grafanaAPIClient.createUser(user);
  });
};
