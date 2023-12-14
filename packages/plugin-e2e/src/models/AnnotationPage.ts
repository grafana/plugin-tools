import { PluginTestCtx } from '../types';
import { AnnotationEditPage } from './AnnotationEditPage';
import { GrafanaPage } from './GrafanaPage';

export class AnnotationPage extends GrafanaPage {
  constructor(ctx: PluginTestCtx) {
    super(ctx);
  }

  async goto() {
    await this.ctx.page.goto(this.ctx.selectors.pages.AddDashboard.Annotations.url, {
      waitUntil: 'networkidle',
    });
  }

  async clickAddNew() {
    const { Dashboard } = this.ctx.selectors.pages;
    this.getByTestIdOrAriaLabel(Dashboard.Settings.Annotations.List.addAnnotationCTAV2).click();
    return new AnnotationEditPage(this.ctx);
  }
}
