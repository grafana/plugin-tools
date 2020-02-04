# grafana-tsconfig
> Grafana's [TypeScript](https://typescriptlang.org) config.


## Installation
```shell
yarn add @grafana/tsconfig --dev
```

or:
```shell
npm install @grafana/tsconfig --save-dev
```


## Usage
```json
{
  "extends": "@grafana/tsconfig"
}
```

or:
```json
{
  "extends": "@grafana/tsconfig/base.json"
}
```


## Publishing
```shell
npm publish
```

Also be sure to update any official packages that depend on this with fixes and version increases.


## Versioning
It's probable that *any* change will be a breaking one, so it's best to stick to major version releases.
