import * as semver from 'semver';
import { PluginTestCtx } from '../types';
import { AnnotationEditPage } from './AnnotationEditPage';
import { GrafanaPage } from './GrafanaPage';

export class AnnotationPage extends GrafanaPage {
  constructor(ctx: PluginTestCtx) {
    super(ctx);
  }

  async goto() {
    await this.ctx.page.goto(this.ctx.selectors.pages.AddDashboard.Settings.Annotations.List.url, {
      waitUntil: 'networkidle',
    });
  }

  async clickAddNew() {
    const { Dashboard } = this.ctx.selectors.pages;

    if (semver.gte(this.ctx.grafanaVersion, '8.3.0')) {
      await this.getByTestIdOrAriaLabel(Dashboard.Settings.Annotations.List.addAnnotationCTAV2).click();
    } else {
      await this.getByTestIdOrAriaLabel(Dashboard.Settings.Annotations.List.addAnnotationCTA).click();
    }
    return new AnnotationEditPage(this.ctx);
  }
}
