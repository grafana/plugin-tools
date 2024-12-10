import { Locator, Page } from '@playwright/test';
import { test, expect } from '../../../src';
import { gte, lte } from 'semver';

test('selecting value in radio button group', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getCustomOptions('Clock');
  const countdownOptions = panelEdit.getCustomOptions('Countdown');
  const clockMode = clockOptions.getRadioGroup('Mode');

  await expect(countdownOptions.element).not.toBeVisible();

  await clockMode.check('Countdown');
  await expect(clockMode).toHaveChecked('Countdown');

  await expect(countdownOptions.element).toBeVisible();
});

test('re-selecting value in radio button group', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getCustomOptions('Clock');
  const countdownOptions = panelEdit.getCustomOptions('Countdown');
  const clockMode = clockOptions.getRadioGroup('Mode');

  await expect(countdownOptions.element).not.toBeVisible();

  await clockMode.check('Countdown');
  await expect(clockMode).toHaveChecked('Countdown');

  await expect(countdownOptions.element).toBeVisible();

  await clockMode.check('Time');
  await expect(clockMode).toHaveChecked('Time');
});

test('checking switch', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getCustomOptions('Clock');
  const monospaceFont = clockOptions.getSwitch('Font monospace');

  await expect(monospaceFont).toBeChecked({ checked: false });
  await monospaceFont.check();
  await expect(monospaceFont).toBeChecked();
});

test('unchecking switch', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getCustomOptions('Clock');
  const monospaceFont = clockOptions.getSwitch('Font monospace');

  await expect(monospaceFont).toBeChecked({ checked: false });
  await monospaceFont.check();
  await expect(monospaceFont).toBeChecked();

  await monospaceFont.uncheck();
  await expect(monospaceFont).toBeChecked({ checked: false });
});

test('enter value in input', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const timeFormatOptions = panelEdit.getCustomOptions('Time Format');
  const fontSize = timeFormatOptions.getTextInput('Font size');

  await expect(fontSize).toHaveValue('12px');
  await fontSize.fill('19px');
  await expect(fontSize).toHaveValue('19px');
});

test('clear input', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const timeFormatOptions = panelEdit.getCustomOptions('Time Format');
  const fontSize = timeFormatOptions.getTextInput('Font size');

  await expect(fontSize).toHaveValue('12px');
  await fontSize.clear();
  await expect(fontSize).toHaveValue('');
});

test('select value in single value select', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const timeFormatOptions = panelEdit.getCustomOptions('Timezone');
  // This one is a bit weird since the select don't have a field label
  const timeZoneSelect = timeFormatOptions.getSelect('Timezone');

  await timeZoneSelect.selectOption('Europe/Stockholm');
  await expect(timeZoneSelect).toHaveSelected('Europe/Stockholm');
});

test('enter value in slider', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'eda84f4d-0b3c-4e4d-815d-7fcb9aa702c2' }, id: '1' });
  const graphOptions = panelEdit.getCustomOptions('Graph styles');
  const lineWith = graphOptions.getSliderInput('Line width');

  await lineWith.fill('10');

  await expect(lineWith).toHaveValue('10');
});

test('enter value in number input', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'eda84f4d-0b3c-4e4d-815d-7fcb9aa702c2' }, id: '1' });
  const graphOptions = panelEdit.getCustomOptions('Axis');
  const lineWith = graphOptions.getNumberInput('Soft min');

  await lineWith.fill('10');

  await expect(lineWith).toHaveValue('10');
});

test('select color in color picker', async ({ gotoPanelEditPage, grafanaVersion, page }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '3' });
  const clockOptions = panelEdit.getCustomOptions('Clock');
  const backgroundColor = clockOptions.getColorPicker('Background color');

  await backgroundColor.selectOption('green');
  await expect(backgroundColor).toHaveColor('green');

  // Not the best way to select the color of the panel need to fix this
  await expect(getPanelContent(grafanaVersion, page).locator('div')).toHaveCSS(
    'background-color',
    'rgb(115, 191, 105)'
  );
});

test('select unit in unit picker', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'eda84f4d-0b3c-4e4d-815d-7fcb9aa702c2' }, id: '1' });
  const standardOptions = panelEdit.getStandardOptions();
  const unitPicker = standardOptions.getUnitPicker('Unit');

  await unitPicker.selectOption('Misc > Pixels');

  await expect(unitPicker).toHaveSelected('Pixels');
});

test('select timezone in timezone picker', async ({ gotoPanelEditPage, grafanaVersion }) => {
  test.skip(lte(grafanaVersion, '9.1.0'), 'This feature is only available starting from Grafana 9.1.0');

  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'eda84f4d-0b3c-4e4d-815d-7fcb9aa702c2' }, id: '1' });
  const axisOptions = panelEdit.getCustomOptions('Axis');
  const timeZonePicker = axisOptions.getSelect('Time zone');

  await timeZonePicker.selectOption('Europe/Stockholm');
  await expect(timeZonePicker).toHaveSelected('Europe/Stockholm');
});

function getPanelContent(grafanaVersion: string, page: Page): Locator {
  if (gte(grafanaVersion, '9.5.0')) {
    return page.locator('div[class*="-panel-content"]');
  }
  return page.locator('div.panel-content');
}
