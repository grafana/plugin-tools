import { expect, test } from '../../../../src';

test('editor populates query from url', async ({ explorePage }) => {
  await explorePage.goto({
    queryParams: new URLSearchParams(
      `panes=%7B%22xlX%22:%7B%22datasource%22:%22undefined%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22datasource%22:%7B%22type%22:%22grafana-redshift-datasource%22,%22uid%22:%22P7DC3E4760CFAC4AH%22%7D,%22rawSQL%22:%22SELECT%20%2A%20FROM%20public.average_temperature%22,%22format%22:0%7D%5D,%22range%22:%7B%22from%22:%221579046400000%22,%22to%22:%221607990400000%22%7D%7D%7D&schemaVersion=1&orgId=1&left=%7B%22datasource%22:%22P7DC3E4760CFAC4AH%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22datasource%22:%7B%22type%22:%22grafana-redshift-datasource%22,%22uid%22:%22P7DC3E4760CFAC4AH%22%7D,%22rawSQL%22:%22SELECT%20%2A%20FROM%20public.average_temperature%22,%22format%22:0%7D%5D,%22range%22:%7B%22from%22:%22now-1h%22,%22to%22:%22now%22%7D%7D`
    ),
  });
  const queryEditorRowLocator = explorePage.getQueryEditorRow('A');
  await expect(queryEditorRowLocator).toContainText('SELECT * FROM public.average_temperature');
});
