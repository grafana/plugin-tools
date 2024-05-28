import { test as setup } from '../';

setup('authenticate', async ({ login, createUser, user }) => {
  if (user && !user.skipCreateUser) {
    await createUser();
  }
  await login();
});
