import { Locator } from '@playwright/test';

export type SelectOptionsType = Parameters<Locator['selectOption']>[1];
export type CheckOptionsType = Parameters<Locator['check']>[0];
