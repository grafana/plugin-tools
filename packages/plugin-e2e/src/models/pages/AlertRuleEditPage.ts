import * as semver from 'semver';
import { AlertRuleArgs, NavigateOptions, PluginTestCtx, RequestOptions } from '../../types';
import { GrafanaPage } from './GrafanaPage';
import { AlertRuleQuery } from '../components/AlertRuleQuery';
import { v4 as uuidv4 } from 'uuid';

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

  get alertRuleNameField() {
    if (semver.gte(this.ctx.grafanaVersion, '11.1.0')) {
      return this.getByGrafanaSelector(this.ctx.selectors.components.AlertRules.ruleNameField);
    }

    return this.ctx.page.getByPlaceholder('Give your alert rule a name');
  }

  async addNewRuleFolder(folderName?: string) {
    const { AlertRules } = this.ctx.selectors.components;

    let newFolderButton = semver.lt(this.ctx.grafanaVersion, '11.1.0')
      ? this.ctx.page.getByRole('button', { name: 'New folder' })
      : this.getByGrafanaSelector(AlertRules.newFolderButton);

    await newFolderButton.click();
    (await newFolderButton.isVisible()) && (await newFolderButton.click());

    let dialog = this.ctx.page.getByRole('dialog');
    let root = (await dialog.count()) > 1 ? dialog.last() : dialog;
    let newFolderNameField = this.getByGrafanaSelector(AlertRules.newFolderNameField, { root });
    let newFolderNameCreateButton = this.getByGrafanaSelector(AlertRules.newFolderNameCreateButton, { root });
    if (semver.lt(this.ctx.grafanaVersion, '11.1.0')) {
      newFolderButton = this.ctx.page.getByRole('button', { name: 'New folder' });
      newFolderNameField = this.ctx.page.getByPlaceholder('Enter a name');
      newFolderNameCreateButton = this.ctx.page.getByRole('button', { name: 'Create' });
    }
    await newFolderNameField.fill(folderName ?? uuidv4());
    await newFolderNameCreateButton.click();
  }

  async addNewEvaluationGroup(options?: { interval?: string; groupName?: string }) {
    const { AlertRules } = this.ctx.selectors.components;
    let newEvaluationGroupButton = this.getByGrafanaSelector(AlertRules.newEvaluationGroupButton);
    let newEvaluationGroupName = this.getByGrafanaSelector(AlertRules.newEvaluationGroupName);
    let newEvaluationGroupInterval = this.getByGrafanaSelector(AlertRules.newEvaluationGroupInterval);
    let newEvaluationGroupCreate = this.getByGrafanaSelector(AlertRules.newEvaluationGroupCreate);
    if (semver.lt(this.ctx.grafanaVersion, '11.1.0')) {
      newEvaluationGroupButton = this.ctx.page.getByRole('button', { name: 'New evaluation group' });
      newEvaluationGroupName = this.ctx.page.getByPlaceholder('Enter a name');
      newEvaluationGroupInterval = this.ctx.page.getByPlaceholder('e.g. 5m');
      newEvaluationGroupCreate = this.ctx.page.getByRole('button', { name: 'Create' });
    }
    await newEvaluationGroupButton.click();
    await newEvaluationGroupName.fill(options?.groupName ?? uuidv4());
    await newEvaluationGroupInterval.fill(options?.interval ?? '5m');
    await newEvaluationGroupCreate.click();
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
