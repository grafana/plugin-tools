import { VersionedSelector, VersionedSelectorWithArgs, VersionedSelectorGroup } from './types';

export function verifySelector(selectors: VersionedSelector): VersionedSelector {
  return selectors;
}

export function verifySelectorWithArgs<T extends object>(
  selectors: VersionedSelectorWithArgs<T>
): VersionedSelectorWithArgs<T> {
  return selectors;
}

export function verifySelectorGroup<T>(group: VersionedSelectorGroup): T {
  return group as T;
}
