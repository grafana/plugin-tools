import { expect } from '@playwright/test';
import { getMessage } from './utils';
import { AlertPageOptions } from '../types';
import { GrafanaPage } from '../models/pages/GrafanaPage';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';
export const toHaveAlert = async (grafanaPage: GrafanaPage, severity: AlertVariant, options?: AlertPageOptions) => {
  let pass = true;
  let message: any = `An alert of variant ${severity} to be displayed on the page`;

  try {
    const filteredAlerts = grafanaPage
      .getByGrafanaSelector(grafanaPage.ctx.selectors.components.Alert.alertV2(severity))
      .filter({
        hasText: options?.hasText,
        hasNotText: options?.hasNotText,
        has: options?.has,
        hasNot: options?.hasNot,
      });
    await expect(filteredAlerts.first()).toBeVisible({ timeout: options?.timeout });
  } catch (err: unknown) {
    message = getMessage(message, `No alert was found on the page: ${err instanceof Error ? err.toString() : ''}`);
    pass = false;
  }

  return {
    message: () => message,
    pass,
  };
};
