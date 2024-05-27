import { VersionedSelector, VersionedSelectorWithArgs } from '../types';

export function createSelector(selectors: VersionedSelector): VersionedSelector {
  return selectors;
}

export function createSelectorWithArgs<T extends object>(
  selectors: VersionedSelectorWithArgs<T>
): VersionedSelectorWithArgs<T> {
  return selectors;
}
