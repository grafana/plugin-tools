import { test as setup } from '../src';

setup('authenticate', async ({ login }) => {
  await login();
});
