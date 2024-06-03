import { VersionedSelector, SelectorRecord, VersionedSelectorWithArgs } from './types';

export function verifySelector(selectors: VersionedSelector): VersionedSelector {
  return selectors;
}

export function verifySelectorWithArgs<T extends object>(
  selectors: VersionedSelectorWithArgs<T>
): VersionedSelectorWithArgs<T> {
  return selectors;
}

export function verifySelectors<T>(selectors: SelectorRecord): T {
  return selectors as T;
}
