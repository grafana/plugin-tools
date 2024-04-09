#!/usr/bin/env node
import { extractPluginMeta } from '../meta-extractor';
const fs = require('fs');

const entryPath = process.argv[2];

// Check if the first argument is present
if (entryPath === undefined) {
  console.error('Please provide the path for the module.ts / module.tsx as an argument.');
  console.error('(E.g. "npx @grafana/plugin-meta-extractor ./src/module.ts")');
  process.exit(1);
}

// Check if the file exists
if (!fs.existsSync(entryPath)) {
  console.error(`File not found: ${entryPath}`);
  process.exit(1);
}

// Check if it is a module file
const fileName = entryPath.split('/').pop();
if (!fileName?.match(/^(module\.ts|module\.tsx)$/)) {
  console.error(
    `The tool can only run against a "module.ts" or "module.tsx" plugin file.\nThe following path is invalid: "${entryPath}".`
  );
  process.exit(1);
}

const pluginMeta = extractPluginMeta(entryPath);
console.log(JSON.stringify(pluginMeta, null, 4));
