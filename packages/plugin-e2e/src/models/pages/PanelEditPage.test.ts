import { describe, it, expect } from 'vitest';
import { PanelEditPage } from './PanelEditPage';
import { PluginTestCtx } from '../../types';

describe('PanelEditPage.getQueryEditorRow', () => {
  it('only needs the query editor row selectors', () => {
    const ctx = {
      page: { locator: (selector: string) => ({ selector, filter: () => ({ selector }) }) },
      grafanaVersion: '13.4.0',
      selectors: {
        components: {
          QueryEditorRows: { rows: 'data-testid Query editor row' },
          QueryEditorRow: { title: (refId: string) => `data-testid Query editor row title ${refId}` },
          PanelEditor: { General: { content: 'data-testid Panel editor content' } },
          Panels: { Panel: { title: (title: string) => `data-testid Panel header ${title}` } },
        },
      },
    } as unknown as PluginTestCtx;

    expect(() => new PanelEditPage(ctx, { id: '1' }).getQueryEditorRow('A')).not.toThrow();
  });
});

describe('PanelEditPage.goto', () => {
  function createPage({ isEditorShown, redirectedUrl }: { isEditorShown: boolean; redirectedUrl?: string }) {
    const pending = new Promise<void>(() => {});
    const ctx = {
      page: {
        goto: async () => {},
        locator: () => ({ waitFor: () => (isEditorShown ? Promise.resolve() : pending) }),
        waitForURL: (predicate: (url: URL) => boolean) =>
          redirectedUrl && predicate(new URL(redirectedUrl)) ? Promise.resolve() : pending,
      },
      grafanaVersion: '13.4.0',
      selectors: {
        pages: { Dashboard: { url: (uid: string) => `/d/${uid}` } },
        components: {
          PanelEditor: { General: { content: 'data-testid Panel editor content' } },
          Panels: { Panel: { title: (title: string) => `data-testid Panel header ${title}` } },
        },
      },
    } as unknown as PluginTestCtx;

    return new PanelEditPage(ctx, { id: '999', dashboard: { uid: 'abc' } });
  }

  it('resolves once the panel editor is visible', async () => {
    await expect(createPage({ isEditorShown: true }).goto()).resolves.toBeUndefined();
  });

  it('resolves when Grafana redirects away from an unknown panel id', async () => {
    await expect(
      createPage({ isEditorShown: false, redirectedUrl: 'http://localhost:3000/d/abc' }).goto()
    ).resolves.toBeUndefined();
  });
});
