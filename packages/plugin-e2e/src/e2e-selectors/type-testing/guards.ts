import { VersionedSelector, VersionedSelectorGroup } from './types';
import { keysOf } from './utils';

export function isVersionedSelectors(value: unknown): value is VersionedSelector {
  const notSelectorFunction = keysOf(value).find((key) => typeof value[key] !== 'function');
  return !Boolean(notSelectorFunction);
}

export function isVersionedSelectorsGroup<Type extends VersionedSelectorGroup<Type>>(
  value: unknown
): value is VersionedSelectorGroup<Type> {
  const notAGroup = keysOf(value).find((key) => typeof value[key] !== 'object');
  return typeof notAGroup === 'undefined';
}
