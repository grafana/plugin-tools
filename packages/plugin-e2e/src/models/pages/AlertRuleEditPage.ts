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

  getAlertRuleQueryRow(refId: string): AlertRuleQuery {
    const locator = this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRows.rows).filter({
      has: this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRow.title(refId)),
    });

    return new AlertRuleQuery(this.ctx, locator);
  }

  async evaluate(options?: RequestOptions) {
    if (semver.gte(this.ctx.grafanaVersion, '10.0.0')) {
      this.ctx.page.route(this.ctx.selectors.apis.Alerting.eval, async (route) => {
        const response = await route.fetch();
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

    await this.ctx.page.getByRole('button', { name: 'Preview', exact: true }).click();
    return responsePromise;
  }
}
