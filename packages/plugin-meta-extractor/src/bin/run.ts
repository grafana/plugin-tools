#!/usr/bin/env node
import { extractExtensionPoints } from '../meta-extractor';

const entryPath = process.argv[2];

// Check if the first argument is present
if (entryPath === undefined) {
  console.error('Please provide the path for the module.ts / module.tsx as an argument.');
  console.error('(E.g. "npx @grafana/plugin-meta-extractor ./src/module.ts")');
  process.exit(1);
}

console.log(`Checking extension points for ${entryPath}`);
const extensionPoints = extractExtensionPoints(entryPath);
console.log(`Found ${extensionPoints.length} extension points:`);
console.log(extensionPoints);
