# Libs/Find-Up

A utility library that finds a file by walking up parent directories. A minimal, native replacement for the [`find-up`](https://www.npmjs.com/package/find-up) npm package covering the synchronous, files-only use cases in this repository.

## Usage

```ts
import { findUpSync } from '@libs/find-up';

// Find the closest package.json starting from the current working directory.
const packageJsonPath = findUpSync('package.json');

// Find the closest of several files starting from a given directory.
// All names are checked in each directory before moving up to the parent.
const lockfilePath = findUpSync(['yarn.lock', 'pnpm-lock.yaml', 'package-lock.json'], { cwd: '/some/dir' });
```

Returns the absolute path of the first match, or `undefined` if no match was found before reaching the filesystem root.
