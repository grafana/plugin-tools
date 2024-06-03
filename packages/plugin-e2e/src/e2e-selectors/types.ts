import {
  SelectorResolver,
  SelectorResolverWithArgs,
  VersionedAPIs,
  VersionedComponents,
  VersionedPages,
  VersionedSelector,
  VersionedSelectorWithArgs,
} from './versioned';

export type E2ESelectors = {
  pages: SelectorsOf<VersionedPages>;
  components: SelectorsOf<VersionedComponents>;
  apis: SelectorsOf<VersionedAPIs>;
};

export type SelectorsOf<T> = {
  [Property in keyof T]: T[Property] extends VersionedSelector
    ? SelectorResolver
    : T[Property] extends VersionedSelectorWithArgs<infer A>
    ? SelectorResolverWithArgs<A>
    : SelectorsOf<T[Property]>;
};
