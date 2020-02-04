# grafana-tsconfig
> Grafana's [ESLint](https://eslint.org) config.


## Installation
```shell
yarn add @grafana/eslint-config --dev
```

or:
```shell
npm install @grafana/eslint-config --save-dev
```


## Usage
```json
{
  "extends": ["@grafana/eslint-config"]
}
```

It will automatically handle `*.(js|ts|tsx)` files.


## Publishing
```shell
npm publish
```

Also be sure to update any official packages that depend on this with fixes and version increases.


## Versioning
It's probable that *any* change will be a breaking one, so it's best to stick to major version releases.
