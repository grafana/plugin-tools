import { expect, test } from '../../../../src';

test('editor populates query from url', async ({ explorePage }) => {
  await explorePage.goto({
    queryParams: new URLSearchParams(
      `schemaVersion=1&panes=%7B%22oae%22:%7B%22datasource%22:%22--%20Mixed%20--%22,%22queries%22:%5B%7B%22constant%22:9,%22refId%22:%22A%22,%22datasource%22:%7B%22type%22:%22grafana-test-datasource%22,%22uid%22:%22P6E498B96656A7F9B%22%7D,%22queryText%22:%22test%20query%22,%22project%22:%22project-2%22%7D%5D,%22range%22:%7B%22from%22:%22now-1h%22,%22to%22:%22now%22%7D%7D%7D&orgId=1`
    ),
  });
  const queryEditorRowLocator = explorePage.getQueryEditorRow('A');
  await expect(queryEditorRowLocator.getByRole('textbox', { name: 'Query Text' })).toHaveValue('test query');
  await expect(queryEditorRowLocator.getByRole('spinbutton', { name: 'Constant' })).toHaveValue('9');
});
