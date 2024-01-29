import * as semver from 'semver';
import { PluginTestCtx, GetByTestIdOrAriaLabelOptions } from '../types';
import { GrafanaPage } from './GrafanaPage';
import { Locator } from '@playwright/test';

/**
 * Provides helpers for interacting with components on the Grafana UI. Should be used
 * only for components that are hard to interact with or requires different logic for
 * different Grafana versions.
 */
export function ui(ctx: PluginTestCtx, getByTestIdOrAriaLabel: GrafanaPage['getByTestIdOrAriaLabel']) {
  return {
    radioButton: {
      click: async (label: string, options?: { exact?: boolean }) => {
        // cannot select by label since this pr https://github.com/grafana/grafana/pull/78010
        if (semver.gte(ctx.grafanaVersion, '9.3.0')) {
          await ctx.page.getByText(label, options).click();
        } else {
          await ctx.page.getByLabel(label, options).click({ timeout: 1000 });
        }
      },
    },
    codeEditor: {
      insertText: async (text: string, options?: GetByTestIdOrAriaLabelOptions) => {
        await ctx.page.waitForFunction(() => (window as any).monaco);
        await getByTestIdOrAriaLabel(ctx.selectors.components.CodeEditor.container, options).click();
        await ctx.page.keyboard.insertText(text);
      },
      click: async (options?: { root?: Locator }) => {
        await ctx.page.waitForFunction(() => (window as any).monaco);
        await getByTestIdOrAriaLabel(ctx.selectors.components.CodeEditor.container, options).click();
      },
    },
  };
}
