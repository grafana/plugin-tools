import { versionedAPIs } from './apis';
import { versionedComponents } from './components';
import { versionedPages } from './pages';

export type VersionedSelectors = {
  pages: typeof versionedPages;
  components: typeof versionedComponents;
  apis: typeof versionedAPIs;
};

export type SelectorResolver = () => string;

export type SelectorResolverWithArgs<T extends object> = (arg: T) => string;

export type VersionedSelector = Record<string, SelectorResolver>;

export type VersionedSelectorWithArgs<T extends object> = Record<string, SelectorResolverWithArgs<T>>;

export type L1Selectors = Record<
  string,
  | VersionedSelector
  | VersionedSelectorWithArgs<object>
  | Record<string, VersionedSelector | VersionedSelectorWithArgs<object>>
>;
export type L2Selectors = L1Selectors | Record<string, L1Selectors>;
export type L3Selectors = L2Selectors | Record<string, L2Selectors>;
export type L4Selectors = L3Selectors | Record<string, L3Selectors>;
export type L5Selectors = L4Selectors | Record<string, L4Selectors>;
export type L6Selectors = L5Selectors | Record<string, L5Selectors>;
export type L7Selectors = L6Selectors | Record<string, L6Selectors>;
export type L8Selectors = L6Selectors | Record<string, L7Selectors>;
