import path = require('path');
import { Fixtures } from '@playwright/test';
import { PluginOptions } from './types';
import { DEFAULT_ADMIN_USER } from './fixtures/commands/login';

export const options: Fixtures<{}, PluginOptions> = {
  user: [undefined, { option: true, scope: 'worker' }],
  featureToggles: [{}, { option: true, scope: 'worker' }],
  provisioningRootDir: [path.join(process.cwd(), 'provisioning'), { option: true, scope: 'worker' }],
  grafanaAPIUser: [DEFAULT_ADMIN_USER, { option: true, scope: 'worker' }],
};
