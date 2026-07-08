import path = require('path');
import { Fixtures } from '@playwright/test';
import { PluginOptions, User } from './types';

export const DEFAULT_ADMIN_USER: User = {
  user: process.env.GRAFANA_ADMIN_USER || 'admin',
  password: process.env.GRAFANA_ADMIN_PASSWORD || 'admin',
};

export const DEFAULT_OPEN_FEATURE_FLAGS = {
  // disable the splash screen by default for all consumers of plugin-e2e
  splashScreen: false,
  // keep the variables and annotations tabs on the dashboard settings page.
  // when this flag is enabled (default since Grafana 13.2.0), the tabs only show
  // an alert pointing to the dashboard sidebar, which breaks VariableEditPage and AnnotationEditPage
  'grafana.dashboardSettingsRedesign': false,
};

export const options: Fixtures<{}, PluginOptions> = {
  userPreferences: [{}, { option: true, scope: 'worker' }],
  featureToggles: [{}, { option: true, scope: 'worker' }],
  openFeature: [
    { flags: {}, latency: 0 },
    { option: true, scope: 'worker' },
  ],
  provisioningRootDir: [path.join(process.cwd(), 'provisioning'), { option: true, scope: 'worker' }],
  user: [DEFAULT_ADMIN_USER, { option: true, scope: 'worker' }],
  grafanaAPICredentials: [DEFAULT_ADMIN_USER, { option: true, scope: 'worker' }],
};
