import { HelperOptions } from 'handlebars';

// Why? The `{#if}` expression in Handlebars unfortunately only accepts a boolean, which makes it hard to compare values in templates.
export const ifEq = (a: any, b: any, options: HelperOptions) => {
  return a === b ? options.fn(this) : options.inverse(this);
};
