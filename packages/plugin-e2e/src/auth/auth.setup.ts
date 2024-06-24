import { test as setup } from '../';

setup('authenticate', async ({ login, createUser, user, grafanaAPICredentials }) => {
  if (user && (user.user !== grafanaAPICredentials.user || user.password !== grafanaAPICredentials.password)) {
    await createUser();
  }
  await login();
});
