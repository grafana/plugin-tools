# Libs/Output

This library consists of a single class "Output". Sharing as a workspace allows for consistent messaging across all our CLI applications in this repo.

## Usage

Instantiate the Output class with the cli name and version.

```ts
import { Output } from '@libs/output';
import { getVersion } from './utils/utils.version.js';

export const output = new Output('create plugin', getVersion());
```

You can then call the various methods on Output to inform users.
