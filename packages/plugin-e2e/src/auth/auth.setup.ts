import { test as setup } from '../';

setup('authenticate', async ({ login, createUser, user }) => {
  if (user) {
    await createUser();
  }
  await login();
});
