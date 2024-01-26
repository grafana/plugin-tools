import { test as setup } from '../api';

setup('authenticate', async ({ login }) => {
  await login();
});
