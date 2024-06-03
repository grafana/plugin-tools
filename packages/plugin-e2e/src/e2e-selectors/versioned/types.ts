import { VersionedAPIs } from './apis';
import { VersionedComponents } from './components';
import { VersionedPages } from './pages';

export type SelectorResolver = () => string;

export type SelectorResolverWithArgs<T extends {}> = (arg: T) => string;

export type VersionedSelector = Record<string, SelectorResolver>;

export type VersionedSelectorWithArgs<T extends object> = Record<string, SelectorResolverWithArgs<T>>;

type SelectorRecord<T> = T | Record<string, T>;
type SelectorRecordL1 = SelectorRecord<VersionedSelector | VersionedSelectorWithArgs<any>>;
type SelectorRecordL2 = SelectorRecord<SelectorRecordL1>;
type SelectorRecordL3 = SelectorRecord<SelectorRecordL2>;
type SelectorRecordL4 = SelectorRecord<SelectorRecordL3>;
type SelectorRecordL5 = SelectorRecord<SelectorRecordL4>;
type SelectorRecordL6 = SelectorRecord<SelectorRecordL5>;
type SelectorRecordL7 = SelectorRecord<SelectorRecordL6>;
type SelectorRecordL8 = SelectorRecord<SelectorRecordL7>;
type SelectorRecordL9 = SelectorRecord<SelectorRecordL8>;

export type SelectorRecordL10 = SelectorRecord<SelectorRecordL9>;

export type VersionedSelectors = {
  components: VersionedComponents;
  apis: VersionedAPIs;
  pages: VersionedPages;
};
