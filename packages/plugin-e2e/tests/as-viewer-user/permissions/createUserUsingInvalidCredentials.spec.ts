import { expect, test } from '../../../src';

test.use({ grafanaAPICredentials: { user: 'test', password: 'test' } });
test('should throw error when credentials are invalid', async ({ grafanaAPIClient }) => {
  await expect(grafanaAPIClient.createUser({ user: 'testuser1', password: 'pass' })).rejects.toThrowError(
    /Could not create user 'testuser1'.*/
  );
});
