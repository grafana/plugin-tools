This directory contains internal libraries that share functionality across the packages. They are not npm workspaces, their inclusion in the published packages is due to:

- TSconfig [paths](../tsconfig.base.json).
- Vitest [aliases](../vitest.config.base.ts) - which are built from the TSconfig paths.
- Using a bundler to bundle the internal library code into the consuming package.

  ```json
  {
    "scripts": {
      "build": "tsup --config ../../tsup.config.ts",
      "dev": "tsup --watch ./src --watch '../../libs'"
    }
  }
  ```
