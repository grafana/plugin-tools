import { describe, it, expect } from 'vitest';
import { getPanelActionsPopoverButtonName, resolveGrafanaSelector } from './utils';

describe('resolveGrafanaSelector', () => {
  describe('data-testid selectors', () => {
    it('wraps a data-testid selector in a data-testid attribute selector', () => {
      expect(resolveGrafanaSelector('data-testid Panel header')).toBe('[data-testid="data-testid Panel header"]');
    });

    it('adds the ^ prefix operator when startsWith is true', () => {
      expect(resolveGrafanaSelector('data-testid Panel header', { startsWith: true })).toBe(
        '[data-testid^="data-testid Panel header"]'
      );
    });

    it('does not add the ^ prefix operator when startsWith is false', () => {
      expect(resolveGrafanaSelector('data-testid Panel header', { startsWith: false })).toBe(
        '[data-testid="data-testid Panel header"]'
      );
    });
  });

  describe('aria-label selectors (fallback)', () => {
    it('wraps a non-data-testid selector in an aria-label attribute selector', () => {
      expect(resolveGrafanaSelector('Panel header')).toBe('[aria-label="Panel header"]');
    });

    it('adds the ^ prefix operator when startsWith is true', () => {
      expect(resolveGrafanaSelector('Panel header', { startsWith: true })).toBe('[aria-label^="Panel header"]');
    });

    it('does not add the ^ prefix operator when startsWith is false', () => {
      expect(resolveGrafanaSelector('Panel header', { startsWith: false })).toBe('[aria-label="Panel header"]');
    });
  });
});

describe('getPanelActionsPopoverButtonName', () => {
  const names = {
    toolbar: 'Panel actions',
    expandButton: 'Expand',
    editButton: 'Edit',
    exploreButton: 'Explore',
    copyButton: 'Copy to clipboard',
    duplicateButton: 'Duplicate',
    removeButton: 'Remove',
  };

  it.each([
    ['View', 'Expand (v)'],
    ['Edit', 'Edit (e)'],
    ['Explore', 'Explore (p x)'],
    ['Copy', 'Copy to clipboard'],
    ['Duplicate', 'Duplicate'],
    ['Remove', 'Remove (p r)'],
  ])('maps the %s menu item to the %s button', (menuItem, buttonName) => {
    expect(getPanelActionsPopoverButtonName(menuItem, names)?.test(buttonName)).toBe(true);
  });

  it('only matches button names that start with the name', () => {
    const pattern = getPanelActionsPopoverButtonName('Edit', names);
    expect(pattern?.test('Edit (e)')).toBe(true);
    expect(pattern?.test('Editor')).toBe(false);
    expect(pattern?.test('Quick edit')).toBe(false);
  });

  it('does not match the restore size button for the View menu item', () => {
    expect(getPanelActionsPopoverButtonName('View', names)?.test('Restore size (v)')).toBe(false);
  });

  it('escapes regular expression characters in the button name', () => {
    const pattern = getPanelActionsPopoverButtonName('Edit', { ...names, editButton: 'Edit (panel)' });
    expect(pattern?.test('Edit (panel) (e)')).toBe(true);
    expect(pattern?.test('Edit panel')).toBe(false);
  });

  it.each(['Inspect', 'Share', 'More...', 'Extensions', 'edit', 'constructor', ''])(
    'returns undefined for the %s menu item, which has no popover button',
    (menuItem) => {
      expect(getPanelActionsPopoverButtonName(menuItem, names)).toBeUndefined();
    }
  );
});
