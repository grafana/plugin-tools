import { test, expect } from '../../../src';

test('selecting value in radio button group', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getOptionsGroup('Clock');
  const countdownOptions = panelEdit.getOptionsGroup('Countdown');
  const clockMode = clockOptions.getRadioButtonGroup('Mode');

  await expect(countdownOptions.getLocator()).not.toBeVisible();

  await clockMode.getByLabel('Countdown').check();
  await expect(clockMode.getByLabel('Countdown')).toBeChecked();

  await expect(countdownOptions.getLocator()).toBeVisible();
});

test('re-selecting value in radio button group', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getOptionsGroup('Clock');
  const countdownOptions = panelEdit.getOptionsGroup('Countdown');
  const clockMode = clockOptions.getRadioButtonGroup('Mode');

  await expect(countdownOptions.getLocator()).not.toBeVisible();

  await clockMode.getByLabel('Countdown').check();
  await expect(clockMode.getByLabel('Countdown')).toBeChecked();

  await expect(countdownOptions.getLocator()).toBeVisible();

  await clockMode.getByLabel('Time').check();
  await expect(clockMode.getByLabel('Time')).toBeChecked();
});

test('checking switch', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getOptionsGroup('Clock');
  const monospaceFont = await clockOptions.getSwitch('Font monospace');

  await expect(monospaceFont).not.toBeChecked();
  await monospaceFont.check();
  await expect(monospaceFont).toBeChecked();
});

test('unchecking switch', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getOptionsGroup('Clock');
  const monospaceFont = await clockOptions.getSwitch('Font monospace');

  await expect(monospaceFont).not.toBeChecked();

  await monospaceFont.check();
  await expect(monospaceFont).toBeChecked();

  await monospaceFont.uncheck();
  await expect(monospaceFont).not.toBeChecked();
});

test('enter value in input', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const timeFormatOptions = panelEdit.getOptionsGroup('Time Format');
  const fontSize = timeFormatOptions.getInput('Font size');

  await expect(fontSize).toHaveValue('12px');
  fontSize.fill('19px');
  await expect(fontSize).toHaveValue('19px');
});

test('clear input', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const timeFormatOptions = panelEdit.getOptionsGroup('Time Format');
  const fontSize = timeFormatOptions.getInput('Font size');

  await expect(fontSize).toHaveValue('12px');
  fontSize.clear();
  await expect(fontSize).toHaveValue('');
});
