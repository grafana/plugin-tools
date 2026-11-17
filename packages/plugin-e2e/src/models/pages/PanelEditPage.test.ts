import { describe, it, expect } from 'vitest';
import { PanelEditPage } from './PanelEditPage';
import { PluginTestCtx } from '../../types';

// stands in for a Playwright locator: records the calls chained on it so tests can read the resulting chain
interface FakeLocator {
  chain: string[];
  filter(options: object): FakeLocator;
  or(other: FakeLocator): FakeLocator;
}

function fakeLocator(chain: string[]): FakeLocator {
  return {
    chain,
    filter: () => fakeLocator([...chain, 'filter']),
    or: (other) => fakeLocator([...chain, 'or', ...other.chain]),
  };
}

function getQueryEditorRow(grafanaVersion: string, withQueryEditorNextSelectors: boolean, refId = 'A') {
  const ctx = {
    page: { locator: (selector: string) => fakeLocator([selector]) },
    grafanaVersion,
    selectors: {
      components: {
        QueryEditorRows: { rows: 'data-testid Query editor row' },
        QueryEditorRow: { title: (refId: string) => `data-testid Query editor row title ${refId}` },
        PanelEditor: { General: { content: 'data-testid Panel editor content' } },
        Panels: { Panel: { title: (title: string) => `data-testid Panel header ${title}` } },
        ...(withQueryEditorNextSelectors && {
          QueryEditorNext: { queryName: 'data-testid query-editor-next query name' },
        }),
      },
    },
  } as unknown as PluginTestCtx;

  return (new PanelEditPage(ctx, { id: '1' }).getQueryEditorRow(refId) as unknown as FakeLocator).chain;
}

describe('PanelEditPage.getQueryEditorRow', () => {
  // a Grafana that predates the new query editor selectors serves a runtime tree without them, so reading one throws
  it('only matches the query editor rows on a Grafana without the new query editor selectors', () => {
    const chain = getQueryEditorRow('13.3.1', false);

    expect(chain).not.toContain('or');
    expect(chain).toEqual(['[data-testid="data-testid Query editor row"]', 'filter']);
  });

  it('also matches the selected query editor on a Grafana with the new query editor selectors', () => {
    const chain = getQueryEditorRow('13.4.0', true);

    expect(chain).toContain('or');
    expect(chain).toContain('[data-testid="data-testid Panel editor content"]');
  });

  it('accepts a refId with regex metacharacters', () => {
    expect(() => getQueryEditorRow('13.4.0', true, 'A (copy')).not.toThrow();
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
