import path = require('path');
import { Fixtures } from '@playwright/test';
import { PluginOptions, User } from './types';

export const DEFAULT_ADMIN_USER: User = { 
  user: process.env.GRAFANA_USER || 'admin', 
  password: process.env.GRAFANA_PASSWORD || 'admin' 
};

export const options: Fixtures<{}, PluginOptions> = {
  featureToggles: [{}, { option: true, scope: 'worker' }],
  provisioningRootDir: [path.join(process.cwd(), 'provisioning'), { option: true, scope: 'worker' }],
  user: [DEFAULT_ADMIN_USER, { option: true, scope: 'worker' }],
  grafanaAPICredentials: [DEFAULT_ADMIN_USER, { option: true, scope: 'worker' }],
};
