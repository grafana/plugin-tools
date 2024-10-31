import { test, expect } from '../../../src';

test('selecting value in radio button group', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getOptionsGroup('Clock');
  const countdownOptions = panelEdit.getOptionsGroup('Countdown');
  const clockMode = clockOptions.getRadioGroup('Mode');

  await expect(countdownOptions.element).not.toBeVisible();

  await clockMode.getByLabel('Countdown').check();
  await expect(clockMode.getByLabel('Countdown')).toBeChecked();

  await expect(countdownOptions.element).toBeVisible();
});

test('re-selecting value in radio button group', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const clockOptions = panelEdit.getOptionsGroup('Clock');
  const countdownOptions = panelEdit.getOptionsGroup('Countdown');
  const clockMode = clockOptions.getRadioGroup('Mode');

  await expect(countdownOptions.element).not.toBeVisible();

  await clockMode.getByLabel('Countdown').check();
  await expect(clockMode.getByLabel('Countdown')).toBeChecked();

  await expect(countdownOptions.element).toBeVisible();

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
  const fontSize = timeFormatOptions.getTextInput('Font size');

  await expect(fontSize).toHaveValue('12px');
  fontSize.fill('19px');
  await expect(fontSize).toHaveValue('19px');
});

test('clear input', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const timeFormatOptions = panelEdit.getOptionsGroup('Time Format');
  const fontSize = timeFormatOptions.getTextInput('Font size');

  await expect(fontSize).toHaveValue('12px');
  fontSize.clear();
  await expect(fontSize).toHaveValue('');
});

test('select value in single value select', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const timeFormatOptions = panelEdit.getOptionsGroup('Timezone');
  // This one is a bit weird since the select don't have a field label
  const timeZoneSelect = timeFormatOptions.getSelect('Timezone');

  await timeZoneSelect.open();
  await timeZoneSelect.getOption('Europe/Stockholm').click();

  await expect(timeZoneSelect.value()).toHaveText('Europe/Stockholm');
});

test('enter value in slider', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'eda84f4d-0b3c-4e4d-815d-7fcb9aa702c2' }, id: '1' });
  const graphOptions = panelEdit.getOptionsGroup('Graph styles');
  const lineWith = graphOptions.getSliderInput('Line width');

  await lineWith.fill('10');

  await expect(lineWith).toHaveValue('10');
});

test('enter value in number input', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'eda84f4d-0b3c-4e4d-815d-7fcb9aa702c2' }, id: '1' });
  const graphOptions = panelEdit.getOptionsGroup('Axis');
  const lineWith = graphOptions.getNumberInput('Soft min');

  await lineWith.fill('10');

  await expect(lineWith).toHaveValue('10');
});

test('select color in color picker', async ({ gotoPanelEditPage, page }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '3' });
  const clockOptions = panelEdit.getOptionsGroup('Clock');
  const backgroundColor = clockOptions.getColorPicker('Background color');

  await expect(backgroundColor.value()).toHaveValue('dark-blue');
  await backgroundColor.fill('green');

  // Not the best way to select the color of the panel need to fix this
  await expect(page.locator('div[class*="-panel-content"]').locator('div')).toHaveCSS(
    'background-color',
    'rgb(115, 191, 105)'
  );
});

test('select unit in unit picker', async ({ gotoPanelEditPage }) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'eda84f4d-0b3c-4e4d-815d-7fcb9aa702c2' }, id: '1' });
  const standardOptions = panelEdit.getOptionsGroup('Standard options');
  const unitPicker = standardOptions.getUnitPicker('Unit');

  await expect(unitPicker.value()).toHaveValue('');

  await unitPicker.open();
  const option = await unitPicker.getOption('Misc > Pixels');
  await option.click();

  await expect(unitPicker.value()).toHaveValue('Pixels');
});
