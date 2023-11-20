import { Expect } from '@playwright/test';
import { PluginTestCtx } from '../types';
import { DashboardPage } from './DashboardPage';

export class EmptyDashboardPage extends DashboardPage {
  constructor(ctx: PluginTestCtx, expect: Expect<any>) {
    super(ctx, expect);
  }

  async goto() {
    await this.ctx.page.goto(this.ctx.selectors.pages.AddDashboard.url, {
      waitUntil: 'networkidle',
    });
  }
}
