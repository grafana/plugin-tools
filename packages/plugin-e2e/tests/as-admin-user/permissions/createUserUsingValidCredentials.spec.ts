import { expect, test } from '../../../src';

test('should be possible to create user when credentials are valid', async ({ grafanaAPIClient }) => {
  await expect(grafanaAPIClient.createUser({ user: 'testuser1', password: 'pass' })).resolves.toBeUndefined();
  await expect(await grafanaAPIClient.getUserIdByUsername('testuser1')).toBeTruthy();
});
