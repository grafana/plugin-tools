import { expect, test } from '../../../src';

interface PanelPluginMeta {
  name: string;
  hideFromList?: boolean;
  state?: string;
}

test('cycles through every installed panel type without losing the selection', async ({ panelEditPage, page }) => {
  test.setTimeout(120_000);

  const panels = await page.evaluate(() => {
    const win = window as unknown as {
      grafanaBootData: { settings: { panels: Record<string, PanelPluginMeta> } };
    };
    return Object.values(win.grafanaBootData?.settings?.panels ?? {});
  });
  const eligiblePanels = panels.filter((panel) => !panel.hideFromList && panel.state !== 'deprecated');
  expect(eligiblePanels.length).toBeGreaterThan(0);

  for (const panel of eligiblePanels) {
    await panelEditPage.setVisualization(panel.name);
    await expect(panelEditPage.getVisualizationName(), `failed to switch to ${panel.name}`).toHaveText(panel.name);
  }
});
