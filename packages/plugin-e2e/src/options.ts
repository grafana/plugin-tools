import path = require('path');
import { Fixtures } from '@playwright/test';
import { PluginOptions, User } from './types';

export const DEFAULT_ADMIN_USER: User = { user: 'admin', password: 'admin' };

export const options: Fixtures<{}, PluginOptions> = {
  featureToggles: [{}, { option: true, scope: 'worker' }],
  provisioningRootDir: [path.join(process.cwd(), 'provisioning'), { option: true, scope: 'worker' }],
  user: [DEFAULT_ADMIN_USER, { option: true, scope: 'worker' }],
  grafanaAPICredentials: [DEFAULT_ADMIN_USER, { option: true, scope: 'worker' }],
};
