import { test as setup } from '../';
import { DEFAULT_ADMIN_USER } from '../options';

setup('authenticate', async ({ login, createUser, user }) => {
  if (user && (user.user !== DEFAULT_ADMIN_USER.user || user.password !== DEFAULT_ADMIN_USER.password)) {
    await createUser();
  }
  await login();
});
