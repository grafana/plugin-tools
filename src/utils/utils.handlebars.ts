import Handlebars, { HelperOptions } from 'handlebars';
import * as changeCase from 'change-case';
import titleCase from 'title-case';
import upperCase from 'upper-case';
import lowerCase from 'lower-case';

// Why? The `{#if}` expression in Handlebars unfortunately only accepts a boolean, which makes it hard to compare values in templates.
export const ifEq = (a: any, b: any, options: HelperOptions) => {
  return a === b ? options.fn(this) : options.inverse(this);
};

// Needed when we are rendering the templates outside of the context of Plop but still would like to support the same helpers
export function registerHelpers() {
  const helpers = {
    camelCase: changeCase.camelCase,
    snakeCase: changeCase.snakeCase,
    dotCase: changeCase.dotCase,
    pathCase: changeCase.pathCase,
    lowerCase: lowerCase,
    upperCase: upperCase,
    sentenceCase: changeCase.sentenceCase,
    constantCase: changeCase.constantCase,
    titleCase: titleCase,
    dashCase: changeCase.paramCase,
    kabobCase: changeCase.paramCase,
    kebabCase: changeCase.paramCase,
    properCase: changeCase.pascalCase,
    pascalCase: changeCase.pascalCase,
    if_eq: ifEq,
  };

  Object.keys(helpers).forEach((helperName) =>
    Handlebars.registerHelper(helperName, helpers[helperName as keyof typeof helpers])
  );
}
