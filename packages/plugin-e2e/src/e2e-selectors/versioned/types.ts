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
