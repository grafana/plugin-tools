import { expect, test } from '../../../src';

test('using grafanaAPIClient should not change storage state for logged in user', async ({
  grafanaAPIClient,
  page,
}) => {
  // assert one can create user on behalf of the admin credentials
  await expect(grafanaAPIClient.createUser({ user: 'testuser1', password: 'pass' })).resolves.toBeUndefined();
  await expect(await grafanaAPIClient.getUserIdByUsername('testuser1')).toBeTruthy();

  // but logged in user should still only have viewer persmissions
  await page.goto('/');
  await page.goto('/datasources');
  await expect(page).not.toHaveURL(/\/datasources/, { timeout: 15_000 });
});
