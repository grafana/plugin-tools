#!/usr/bin/env node
import { generateTypes } from '../bundleTypes.js';
import { existsSync } from 'fs';

const entryPath = process.argv[2];

// Check if the first argument is present
if (entryPath === undefined) {
  console.error('Please provide the path for the entry types file as an argument.');
  console.error('(E.g. "npx @grafana/plugin-types-bundler ./src/types/index.ts")');
  process.exit(1);
}

// Check if the file exists
if (!existsSync(entryPath)) {
  console.error(`File not found: ${entryPath}`);
  process.exit(1);
}

const startTime = Date.now().valueOf();
try {
  console.log('⚡️ Starting to bundle types for plugin...');
  generateTypes(entryPath);
} catch (error) {
  console.error('Error while bundling types:', error);
  process.exit(1);
}

const endTime = Date.now().valueOf();
console.log(`📦 Types bundled successfully (${endTime - startTime}ms)`);
