import * as semver from 'semver';
import { AlertRuleArgs, NavigateOptions, PluginTestCtx, RequestOptions } from '../../types';
import { GrafanaPage } from './GrafanaPage';
import { AlertRuleQuery } from '../components/AlertRuleQuery';
import { expect } from '@playwright/test';
import { isFeatureEnabled } from '../../fixtures/isFeatureToggleEnabled';
const QUERY_AND_EXPRESSION_STEP_ID = '2';

export class AlertRuleEditPage extends GrafanaPage {
  constructor(
    readonly ctx: PluginTestCtx,
    readonly args?: AlertRuleArgs
  ) {
    super(ctx, args);
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

  get advancedModeSwitch() {
    return this.getByGrafanaSelector(
      this.ctx.selectors.components.AlertRules.stepAdvancedModeSwitch(QUERY_AND_EXPRESSION_STEP_ID)
    );
  }

  async isAdvancedModeSupported() {
    const alertingQueryAndExpressionsStepMode = await isFeatureEnabled(
      this.ctx.page,
      'alertingQueryAndExpressionsStepMode'
    );

    if (alertingQueryAndExpressionsStepMode) {
      await expect(this.advancedModeSwitch).toBeVisible();
      await expect(this.advancedModeSwitch).toHaveCount(1);
      return true;
    }

    await expect(this.advancedModeSwitch).not.toBeVisible();
    await expect(this.advancedModeSwitch).toHaveCount(0);
    return false;
  }

  /*
   * Enables the advanced mode for the query and expression step.
   * Only available in Grafana 11.6.0 and later. If advanced mode is not supported, this method will do nothing.
   */
  async enableAdvancedQueryMode() {
    const advancedModeSupported = await this.isAdvancedModeSupported();
    if (!advancedModeSupported) {
      console.log('Advanced query mode is not supported in this Grafana version. Ignoring the request.');
      return;
    }

    await this.getByGrafanaSelector(
      this.ctx.selectors.components.AlertRules.stepAdvancedModeSwitch(QUERY_AND_EXPRESSION_STEP_ID)
    ).check({ force: true });
  }

  /*
   * Disabled the advanced mode for the query and expression step.
   * Advanced mode is enabled by default in Grafana 11.6.0 and later.
   */
  async disableAdvancedQueryMode() {
    const advancedModeSupported = await this.isAdvancedModeSupported();
    if (!advancedModeSupported) {
      console.log('Advanced query mode is not supported in this Grafana version. Ignoring the request.');
      return;
    }

    await this.getByGrafanaSelector(
      this.ctx.selectors.components.AlertRules.stepAdvancedModeSwitch(QUERY_AND_EXPRESSION_STEP_ID)
    ).uncheck({ force: true });
  }

  async getQueryRow(refId = 'A'): Promise<AlertRuleQuery> {
    const advancedModeSupported = await this.isAdvancedModeSupported();

    if (advancedModeSupported && !(await this.advancedModeSwitch.isChecked()) && refId === 'A') {
      // return the default query row
      return new AlertRuleQuery(this.ctx, this.ctx.page.getByTestId('query-editor-row'));
    }

    // return query by refId
    const locator = this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRows.rows).filter({
      has: this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRow.title(refId)),
    });

    return new AlertRuleQuery(this.ctx, locator);
  }

  /**
   * @deprecated Use getQueryRow instead
   * Returns an instance of the {@link AlertRuleQuery} class for a query in the query and expression step (step 2)
   *
   * @param refId is optional. If not provided, it will return query row with refId 'A' in Grafana versions <11.6.
   * In Grafana versions >=11.6 where advanced mode is supported, it will return the default query if advanced mode
   * is not enabled. If advanced mode is enabled, it will return the a query by refId.
   */
  getAlertRuleQueryRow(refId = 'A'): AlertRuleQuery {
    const locator = this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRows.rows).filter({
      has: this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRow.title(refId)),
    });

    return new AlertRuleQuery(this.ctx, locator);
  }

  /**
   * Clicks the "Add query" button and returns an instance of the {@link AlertRuleQuery} class for the new query row.
   *
   * Since Grafana 11.6, this method is only available if advanced mode is enabled. Use enableQueryAdvancedMode() method to enable it.
   */
  async clickAddQueryRow(): Promise<AlertRuleQuery> {
    const advancedModeSupported = await this.isAdvancedModeSupported();
    if (advancedModeSupported && !(await this.advancedModeSwitch.isChecked())) {
      throw new Error(
        'Since Grafana 11.6, you need to enable advanced mode to add queries. Use enableQueryAdvancedMode() method to enable it.'
      );
    }

    await this.getByGrafanaSelector(this.ctx.selectors.components.QueryTab.addQuery).click();
    const locator = this.getByGrafanaSelector(this.ctx.selectors.components.QueryEditorRows.rows).last();

    return new AlertRuleQuery(this.ctx, locator);
  }

  /**
   * Clicks the evaluate button and waits for the evaluation to complete. If the evaluation is successful, the status code of the response is 200.
   * If one or more queries are invalid, an error status code is returned.
   *
   * Note that this method intercepts the response of the alerting evaluation endpoint and returns the status code of the first failed query.
   * This means that any mocks defined with page.route in your tests will be overriden.
   *
   * Only supported for Grafana version 9.5.0 ad later.
   */
  async evaluate(options?: RequestOptions) {
    // it seems like when clicking the evaluate button to quickly after filling in the alert query form, form values have not been propagated to the state, so we wait a bit before clicking
    await this.ctx.page.waitForTimeout(1000);

    // Starting from Grafana 10.0.0, the alerting evaluation endpoint started returning errors in a different way.
    // Even if one or many of the queries is failed, the status code for the http response is 200 so we have to check the status of each query instead.
    // If at least one query is failed, we the response of the evaluate method is mapped to the status of the first failed query.
    if (semver.gte(this.ctx.grafanaVersion, '10.0.0')) {
      await this.ctx.page.route(this.ctx.selectors.apis.Alerting.eval, async (route) => {
        const response = await route.fetch();
        if (!response.ok()) {
          await route.fulfill({ response });
          return;
        }

        let body: { results: { [key: string]: { status: number } } } = await response.json();
        const statuses = Object.keys(body.results).map((key) => body.results[key].status);

        await route.fulfill({
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

    await expect(evaluateButton).toBeVisible();

    const evalReq = this.ctx.page
      .waitForRequest((req) => req.url().includes(this.ctx.selectors.apis.Alerting.eval), {
        timeout: 5000,
      })
      .catch(async () => {
        // intermittently, the first click doesn't trigger the request, so in that case we click again
        await evaluateButton.click();
      });

    await evaluateButton.click();
    await evalReq;

    return responsePromise;
  }
}
