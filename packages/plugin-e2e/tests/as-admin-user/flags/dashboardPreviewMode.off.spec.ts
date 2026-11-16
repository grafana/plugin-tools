import { test } from '../../../src';
import { dashboardPreviewModeScenarios } from './scenarios/dashboardPreviewMode';

test.use({
  openFeature: { flags: { 'grafana.dashboardPreviewMode': false } },
});

dashboardPreviewModeScenarios(false);
