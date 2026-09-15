import { describe, it, expect } from 'vitest';

import { reconstructSelectorTree } from './reconstruct';

describe('reconstructSelectorTree', () => {
  it('keeps string selectors unchanged', () => {
    const tree = reconstructSelectorTree({ Comp: { sel: { '8.0.0': 'plain string' } } });
    expect(tree).toEqual({ Comp: { sel: { '8.0.0': 'plain string' } } });
  });

  it('reconstructs a one-arg descriptor into an interpolating function', () => {
    const tree = reconstructSelectorTree({
      Comp: { sel: { '8.0.0': { $template: 'data-testid option {value}', params: ['value'] } } },
    }) as any;
    const fn = tree.Comp.sel['8.0.0'];
    expect(typeof fn).toBe('function');
    expect(fn('X')).toBe('data-testid option X');
  });

  it('reconstructs a two-arg descriptor', () => {
    const tree = reconstructSelectorTree({
      s: { '8.0.0': { $template: 'range {from} to {to}', params: ['from', 'to'] } },
    }) as any;
    expect(tree.s['8.0.0']('a', 'b')).toBe('range a to b');
  });

  it('reconstructs a zero-arg (css) descriptor', () => {
    const tree = reconstructSelectorTree({ s: { '8.0.0': { $template: '.some-class', params: [] } } }) as any;
    expect(tree.s['8.0.0']()).toBe('.some-class');
  });

  it('reconstructs a conditional (present/absent) descriptor', () => {
    const tree = reconstructSelectorTree({
      s: {
        '11.1.0': {
          $template: { whenPresent: 'Options group {title}', whenAbsent: 'Options group' },
          params: ['title'],
        },
      },
    }) as any;
    const fn = tree.s['11.1.0'];
    expect(fn('X')).toBe('Options group X');
    expect(fn('')).toBe('Options group');
  });

  it('does not re-replace a param token that appears inside a substituted value', () => {
    const tree = reconstructSelectorTree({
      s: { '8.0.0': { $template: '{pluginId}/{pageId}', params: ['pluginId', 'pageId'] } },
    }) as any;
    // the '{pageId}' inside the pluginId value must stay literal, not become 'settings'
    expect(tree.s['8.0.0']('plugin-{pageId}', 'settings')).toBe('plugin-{pageId}/settings');
  });

  it('throws on a malformed descriptor', () => {
    expect(() => reconstructSelectorTree({ s: { '8.0.0': { $template: 42, params: [] } } })).toThrow();
  });
});
