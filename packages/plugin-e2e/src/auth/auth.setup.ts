import { test as setup } from '../api';

setup('authenticate', async ({ login, createUser, user }) => {
  if (user) {
    await createUser();
  }
  await login();
});
