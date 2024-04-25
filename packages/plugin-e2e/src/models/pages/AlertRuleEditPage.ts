import * as semver from 'semver';
import { AlertRuleArgs, NavigateOptions, PluginTestCtx, RequestOptions } from '../../types';
import { GrafanaPage } from './GrafanaPage';
import { AlertRuleQuery } from '../components/AlertRuleQuery';

export class AlertRuleEditPage extends GrafanaPage {
  constructor(readonly ctx: PluginTestCtx, readonly args?: AlertRuleArgs) {
    super(ctx);
  }

  /**
   * Navigates to the annotation edit page. If a dashboard uid was not provided, it's assumed that it's a new dashboard.
   */
  async goto(options?: NavigateOptions) {
    const { AddAlertRule, EditAlertRule } = this.ctx.selectors.pages.Alerting;
    const url = this.args?.uid ? EditAlertRule.url(this.args.uid) : AddAlertRule.url;

    return super.navigate(url, options);
  }

  /**
   * Returns a locator for hte alert rule name field
   */
  get alertRuleNameField() {
    if (semver.gte(this.ctx.grafanaVersion, '11.1.0')) {
      return this.getByGrafanaSelector(this.ctx.selectors.components.AlertRules.ruleNameField);
    }

    return this.ctx.page.getByPlaceholder('Give your alert rule a name');
  }

  /**
   * Returns an instance of the {@link AlertRuleQuery} class for the query row with the provided refId.
   */
  getAlertRuleQueryRow(refId: string): AlertRuleQuery {
    const locator = this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRows.rows).filter({
      has: this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRow.title(refId)),
    });

    return new AlertRuleQuery(this.ctx, locator);
  }

  /**
   * Clicks the evaluate button and waits for the evaluation to complete. If the evaluation is successful, the status code of the response is 200.
   * If one or more queries are invalid, an error status code is returned.
   */
  async evaluate(options?: RequestOptions) {
    // Starting from Grafana 10.0.0, the alerting evaluation endpoint started returning errors in a different way.
    // Even if one or many of the queries is failed, the status code for the http response is 200 so we have to check the status of each query instead.
    // If at least one query is failed, we the response of the evaluate method is mapped to the status of the first failed query.
    if (semver.gte(this.ctx.grafanaVersion, '10.0.0')) {
      this.ctx.page.route(this.ctx.selectors.apis.Alerting.eval, async (route) => {
        const response = await route.fetch();
        if (!response.ok()) {
          return route.fulfill({ response });
        }

        let body: { results: { [key: string]: { status: number } } } = await response.json();
        const statuses = Object.keys(body.results).map((key) => body.results[key].status);

        route.fulfill({
          response,
          status: statuses.every((status) => status >= 200 && status < 300) ? 200 : statuses[0],
        });
      });
    }
    const responsePromise = this.ctx.page.waitForResponse(
      (resp) => resp.url().includes(this.ctx.selectors.apis.Alerting.eval),
      options
    );

    let evaluateButton = this.getByGrafanaSelector(this.ctx.selectors.components.AlertRules.previewButton);
    if (semver.lt(this.ctx.grafanaVersion, '11.1.0')) {
      evaluateButton = this.ctx.page.getByRole('button', { name: 'Preview', exact: true });
    }
    const evalReq = this.ctx.page
      .waitForRequest((req) => req.url().includes(this.ctx.selectors.apis.Alerting.eval), {
        timeout: 1000,
      })
      .catch(async () => {
        // it seems (intermittently) the first click doesn't trigger the request, so we click again
        await evaluateButton.click();
      });

    await evaluateButton.click();
    await evalReq;

    return responsePromise;
  }
}
