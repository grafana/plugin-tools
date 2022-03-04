import { HelperOptions } from 'handlebars';

export const ifEq = (a: any, b: any, options: HelperOptions) => {
  return a === b ? options.fn(this) : options.inverse(this);
};
