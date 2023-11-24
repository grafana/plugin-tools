/**
 * The types in this section are used to contraint the versioned selectors
 * so they are defined in a consistent way.
 */

export interface SelectorOptions {}

// We could define this to be something else. Just continuing on the
// idea I had before. Not important for the overall structure.
export type SelectorFunction<Type extends SelectorOptions = SelectorOptions> = (options?: Type) => string;

export type VersionedSelector = {
  [Property: string]: SelectorFunction;
};

export type VersionedSelectorGroup<Type extends VersionedSelectorGroup<Type>> = {
  [Property in keyof Type]: VersionedSelector;
};

/**
 * The types in this section are used to dynamically create types based of
 * objects that fulfills the VersionedSelectorGroup type and re-map the
 * VersionedSelector objects to a single SelectorFunction.
 */
export type SelectorsOf<Type extends VersionedSelectorGroup<Type>> = {
  [Property in keyof Type]: Type[Property] extends VersionedSelector ? SelectorFunction : never;
};

/**
 * The following types are used to support table testing
 */
export type SelectorScenario = {
  version: string;
  expected: string;
};
