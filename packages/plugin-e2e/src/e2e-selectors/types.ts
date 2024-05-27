import { versionedComponents, versionedPages } from './versioned';
import { versionedAPIs } from './versioned/apis';
import {
  SelectorResolver,
  SelectorResolverWithArgs,
  VersionedSelector,
  VersionedSelectorWithArgs,
} from './versioned/types';

export type E2ESelectors = {
  pages: SelectorsOf<typeof versionedPages>;
  components: SelectorsOf<typeof versionedComponents>;
  apis: SelectorsOf<typeof versionedAPIs>;
};

// Types to generate typings from the versioned selectors

export type SelectorsOf<T> = {
  [Property in keyof T]: T[Property] extends VersionedSelector
    ? SelectorResolver
    : T[Property] extends VersionedSelectorWithArgs<infer A>
    ? SelectorResolverWithArgs<A>
    : SelectorsOf<T[Property]>;
};
