import { test as setup } from '../';

setup('authenticate', async ({ login, user, createUser, grafanaAPICredentials }) => {
  // there's no need to create the server admin user
  if (user && (user.user !== grafanaAPICredentials.user || user.password !== grafanaAPICredentials.password)) {
    await createUser();
  }
  await login();
});
