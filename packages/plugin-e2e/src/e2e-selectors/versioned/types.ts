import { versionedAPIs } from './apis';
import { versionedComponents } from './components';
import { versionedPages } from './pages';

export type VersionedSelectors = {
  pages: typeof versionedPages;
  components: typeof versionedComponents;
  apis: typeof versionedAPIs;
};

type SelectorFunc = (options: object) => string;

type VersionedSelectors2 = {
  [key: string]: SelectorFunc;
};

type VersionedSelectorGroup<T> = {
  [key in keyof T]: T[key] extends VersionedSelectors2 ? VersionedSelectors2 : VersionedSelectorGroup<T[key]>;
};

const test = {
  datasources: {
    v1: () => '',
  },
  test3: {
    v1: () => '',
  },
  test: {
    asdf: () => '',
  },
};

type Selectors<T extends VersionedSelectorGroup<T>> = {
  [key in keyof T]: T[key] extends VersionedSelectors2 ? SelectorFunc : VersionedSelectorGroup<T[key]>;
};

function toSelectors<T extends VersionedSelectorGroup<T>>(group: T, version: string): Selectors<T> {
  return keysOf<T>(group).reduce((selectors, key) => {
    const v = group[key];

    if (isVersionSelector(v)) {
      // @ts-ignore
      selectors[key] = v[version];
    }

    if (isGroup(v)) {
      selectors[key] = toSelectors(v, version);
    }

    return selectors;
  }, {} as Selectors<T>);
}

function keysOf<T>(object: T): Array<keyof T> {
  return Object.keys(object) as Array<keyof T>;
}

function isVersionSelector(value: unknown): value is VersionedSelectors2 {
  const [key] = keysOf(value);
  return typeof value[key] === 'function';
}

function isGroup<T>(value: unknown): value is VersionedSelectorGroup<T> {
  const notAGroup = keysOf(value).find((key) => typeof value[key] !== 'object');
  return typeof notAGroup === 'undefined';
}

const all = {
  testing: toSelectors<typeof test>(test, ''),
};
