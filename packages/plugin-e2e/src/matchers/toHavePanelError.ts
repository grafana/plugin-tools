import { expect } from '@playwright/test';
import { PanelError } from '../types';
import { getMessage } from './utils';

const toHavePanelError = async (panelError: PanelError, options?: { timeout?: number }) => {
  let pass = true;
  let actual;
  let message: any = 'A panel error to be displayed';

  try {
    const numberOfErrors = await panelError.getPanelError().count();
    await expect(numberOfErrors).toBe(1);
  } catch (_) {
    message = getMessage(message, 'No panel error was found on the page');
    actual = await panelError.getPanelError().count();
    pass = false;
  }

  return {
    message: () => message,
    pass,
    actual,
  };
};

export default toHavePanelError;
