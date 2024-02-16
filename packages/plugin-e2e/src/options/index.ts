import path = require('path');
import { Fixtures } from '@playwright/test';
import { PluginOptions } from '../api';

const options: Fixtures<{}, PluginOptions> = {
  user: [undefined, { option: true, scope: 'worker' }],
  featureToggles: [{}, { option: true, scope: 'worker' }],
  provisioningRootDir: [path.join(process.cwd(), 'provisioning'), { option: true, scope: 'worker' }],
};

export default options;
