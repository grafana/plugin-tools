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

function getQueryEditorRow(grafanaVersion: string, withQueryEditorNextSelectors: boolean) {
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

  return (new PanelEditPage(ctx, { id: '1' }).getQueryEditorRow('A') as unknown as FakeLocator).chain;
}

describe('PanelEditPage.getQueryEditorRow', () => {
  // runtime selectors replace the bundled ones, so a Grafana that predates the new query editor selectors serves a
  // tree without them. Reading one there would throw, and this method is used on every Grafana version.
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
});
