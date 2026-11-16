import { test } from '../../../src';
import { queryEditorNextScenarios } from './scenarios/queryEditorNext';

test.use({
  openFeature: { flags: { queryEditorNext: true } },
});

queryEditorNextScenarios(true);
