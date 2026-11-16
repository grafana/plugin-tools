import { test } from '../../../src';
import { queryEditorNextScenarios } from './scenarios/queryEditorNext';

test.use({
  openFeature: { flags: { queryEditorNext: false } },
});

queryEditorNextScenarios(false);
