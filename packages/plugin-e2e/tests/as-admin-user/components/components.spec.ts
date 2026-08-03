import { expect, test } from '../../../src';

/**
 * DataSourcePicker
 */

test('components.dataSourcePicker should set the data source', async ({
  panelEditPage,
  components,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await components.dataSourcePicker.set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('components.dataSourcePicker.within should set the data source when scoped to a root locator', async ({
  panelEditPage,
  components,
  readProvisionedDataSource,
  selectors,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  const root = panelEditPage.getByGrafanaSelector(selectors.components.PanelEditor.General.content);
  await components.dataSourcePicker.within(root).set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

/**
 * TimeRangePicker
 */

test('components.timeRangePicker should set the time range', async ({
  panelEditPage,
  components,
  selectors,
}) => {
  await components.timeRangePicker.set({ from: '2020-01-01 00:00:00', to: '2020-01-02 00:00:00' });
  // older Grafana versions render the time picker twice, so we use .first() to avoid strict mode violations
  const openButton = panelEditPage.getByGrafanaSelector(selectors.components.TimePicker.openButton).first();
  await expect(openButton).toContainText('2020-01-01 00:00:00');
});

test('components.timeRangePicker.within should set the time range when scoped to a root locator', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
  components,
  selectors,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  await components.timeRangePicker.within(dashboardPage.toolbar).set({ from: '2020-01-01 00:00:00', to: '2020-01-02 00:00:00' });
  const openButton = dashboardPage.getByGrafanaSelector(selectors.components.TimePicker.openButton).first();
  await expect(openButton).toContainText('2020-01-01 00:00:00');
});

/**
 * Select
 */

test('components.select.within should select a value in a single-value select', async ({
  gotoPanelEditPage,
  components,
  selectors,
}) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const root = panelEdit.getByGrafanaSelector(
    selectors.components.PanelEditor.OptionsPane.fieldLabel('Timezone Timezone')
  );
  await components.select.within(root).selectOption('Europe/Stockholm');
  await expect(components.select.within(root)).toHaveSelected('Europe/Stockholm');
});

/**
 * Switch
 */

test('components.switch.within should check a switch', async ({
  gotoPanelEditPage,
  components,
  selectors,
}) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const root = panelEdit.getByGrafanaSelector(
    selectors.components.PanelEditor.OptionsPane.fieldLabel('Clock Font monospace')
  );
  await components.switch.within(root).check();
  await expect(components.switch.within(root)).toBeChecked();
});

/**
 * RadioGroup
 */

test('components.radioGroup.within should check a radio option', async ({
  gotoPanelEditPage,
  components,
  selectors,
}) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '5' });
  const root = panelEdit.getByGrafanaSelector(
    selectors.components.PanelEditor.OptionsPane.fieldLabel('Clock Mode')
  );
  await components.radioGroup.within(root).check('Countdown');
  await expect(components.radioGroup.within(root)).toHaveChecked('Countdown');
});

/**
 * ColorPicker
 */

test('components.colorPicker.within should select a color', async ({
  gotoPanelEditPage,
  components,
  selectors,
}) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'mxb-Jv4Vk' }, id: '3' });
  const root = panelEdit.getByGrafanaSelector(
    selectors.components.PanelEditor.OptionsPane.fieldLabel('Clock Background Color')
  );
  await components.colorPicker.within(root).selectOption('#73bf69');
  await expect(components.colorPicker.within(root)).toHaveColor('#73bf69');
});

/**
 * UnitPicker
 */

test('components.unitPicker.within should select a unit', async ({
  gotoPanelEditPage,
  components,
  selectors,
}) => {
  const panelEdit = await gotoPanelEditPage({ dashboard: { uid: 'be6sir7o1iccgb' }, id: '1' });
  const root = panelEdit.getByGrafanaSelector(
    selectors.components.PanelEditor.OptionsPane.fieldLabel('Standard options Unit')
  );
  await components.unitPicker.within(root).selectOption('Misc > Pixels');
});
