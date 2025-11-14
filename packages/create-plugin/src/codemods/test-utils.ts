import { Context } from './context.js';

export function createDefaultContext() {
  const context = new Context('/virtual');

  context.addFile('.eslintrc', '{}');
  context.addFile('./package.json', '{}');
  context.addFile('./src/README.md', '');
  context.addFile('./src/FOO.md', '');

  return context;
}
