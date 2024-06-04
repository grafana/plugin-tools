import { VersionedAPIs } from './apis';
import { VersionedComponents } from './components';
import { VersionedPages } from './pages';

export type SelectorResolver = () => string;

export type SelectorResolverWithArgs<T extends {}> = (arg: T) => string;

export type VersionedSelector = Record<string, SelectorResolver>;

export type VersionedSelectorWithArgs<T extends object> = Record<string, SelectorResolverWithArgs<T>>;

export type VersionedSelectorGroup = {
  [property: string]: VersionedSelector | VersionedSelectorWithArgs<any> | VersionedSelectorGroup;
};

export type VersionedSelectors = {
  components: VersionedComponents;
  apis: VersionedAPIs;
  pages: VersionedPages;
};
