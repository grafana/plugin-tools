# Libs/Version

A utility library that provides a simple way to retrieve the version of your application from its package.json file.

## Usage

```ts
import { getVersion } from '@libs/version';

const version = getVersion();
console.log(version); // e.g. "1.0.0"
```

If no package.json file was found or the package.json file does not have a version property it will throw an error.
