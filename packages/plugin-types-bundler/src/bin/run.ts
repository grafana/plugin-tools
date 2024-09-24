#!/usr/bin/env node
import { existsSync } from 'fs';
import { generateTypes } from '../bundleTypes.js';
import { parsedArgs } from '../utils.js';

const { entryPoint, tsConfig, outDir } = parsedArgs;

// Check if the first argument is present
if (entryPoint === undefined) {
  console.error('Please provide the path for the entry types file as an argument.');
  console.error('(E.g. "npx @grafana/plugin-types-bundler ./src/types/index.ts")');
  process.exit(1);
}

// Check if the file exists
if (!existsSync(entryPoint)) {
  console.error(`File not found: ${entryPoint}`);
  process.exit(1);
}

const startTime = Date.now().valueOf();
try {
  console.log('⚡️ Starting to bundle types for plugin...');
  generateTypes({ entryPoint, tsConfig, outDir });
} catch (error) {
  console.error('Error while bundling types:', error);
  process.exit(1);
}

const endTime = Date.now().valueOf();
console.log(`📦 Types bundled successfully (${endTime - startTime}ms)`);
