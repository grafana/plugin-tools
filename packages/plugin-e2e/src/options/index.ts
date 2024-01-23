import path = require('path');
import { Fixtures } from '@playwright/test';
import { PluginOptions } from '../api';

const options: Fixtures<{}, PluginOptions> = {
  provisioningRootDir: [path.join(process.cwd(), 'provisioning'), { option: true, scope: 'worker' }],
};

export default options;
