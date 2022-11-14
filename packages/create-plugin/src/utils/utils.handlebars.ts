import Handlebars, { HelperOptions } from 'handlebars';
import * as changeCase from 'change-case';
import titleCase from 'title-case';
import upperCase from 'upper-case';
import lowerCase from 'lower-case';
import { PLUGIN_TYPES } from '../constants';

// Why? The `{#if}` expression in Handlebars unfortunately only accepts a boolean, which makes it hard to compare values in templates.
export const ifEq = (a: any, b: any, options: HelperOptions) => {
  return a === b ? options.fn(this) : options.inverse(this);
};

export const normalizeId = (pluginName: string, orgName: string, type: PLUGIN_TYPES) => {
  const re = new RegExp(`-?${type}$`, 'i');
  const nameRegex = new RegExp('[^0-9a-zA-Z]', 'g');

  const newPluginName = pluginName.replace(re, '').replace(nameRegex, '');
  const newOrgName = orgName.replace(nameRegex, '');
  return changeCase.lowerCase(newOrgName) + '-' + changeCase.lowerCase(newPluginName) + `-${type}`;
};

// Needed when we are rendering the templates outside of the context of Plop but still would like to support the same helpers
export function registerHandlebarsHelpers() {
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
    normalize_id: normalizeId,
  };

  Object.keys(helpers).forEach((helperName) =>
    Handlebars.registerHelper(helperName, helpers[helperName as keyof typeof helpers])
  );
}

export function renderHandlebarsTemplate(template: string, data?: any) {
  registerHandlebarsHelpers();
  return Handlebars.compile(template)(data);
}
