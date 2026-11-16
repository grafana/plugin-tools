import { test } from '../../../src';
import { dashboardPreviewModeScenarios } from './scenarios/dashboardPreviewMode';

test.use({
  openFeature: { flags: { 'grafana.dashboardPreviewMode': true } },
});

dashboardPreviewModeScenarios(true);
