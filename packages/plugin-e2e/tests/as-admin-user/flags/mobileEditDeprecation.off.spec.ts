import { test } from '../../../src';
import { mobileEditDeprecationScenarios } from './scenarios/mobileEditDeprecation';

test.use({
  openFeature: { flags: { 'grafana.mobileEditDeprecation': false } },
  viewport: { width: 500, height: 900 },
});

mobileEditDeprecationScenarios(false);
