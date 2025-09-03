import Handlebars, { HelperOptions } from 'handlebars';
import {
  camelCase,
  snakeCase,
  dotCase,
  pathCase,
  sentenceCase,
  constantCase,
  kebabCase,
  pascalCase,
} from 'change-case';
import { titleCase } from 'title-case';
import { PARTIALS_DIR, PLUGIN_TYPES } from '../constants.js';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

// This function allows comparison of values in templates as the `{#if}` expression in Handlebars only accepts a boolean.
// It must be a function expression for handlebars to bind helper function to template data.
export function ifEq(this: unknown, a: any, b: any, options: HelperOptions) {
  return a === b ? options.fn(this) : options.inverse(this);
}

export const normalizeId = (pluginName: string, orgName: string, type: PLUGIN_TYPES) => {
  const re = new RegExp(`-?${type}$`, 'i');
  const nameRegex = new RegExp('[^0-9a-zA-Z]', 'g');

  const newPluginName = pluginName.replace(re, '').replace(nameRegex, '');
  const newOrgName = orgName.replace(nameRegex, '');
  const newType = type === PLUGIN_TYPES.scenes ? PLUGIN_TYPES.app : type;

  return newOrgName.toLowerCase() + '-' + newPluginName.toLowerCase() + `-${newType}`;
};

export const kebabToPascalKebab = (str: string) => {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .split('-')
    .map((word) => pascalCase(word))
    .join('-');
};

// Register our helpers and partials with handlebars.
registerHandlebarsHelpers();
registerHandlebarsPartials();

function registerHandlebarsHelpers() {
  const helpers = {
    camelCase: camelCase,
    snakeCase: snakeCase,
    dotCase: dotCase,
    pathCase: pathCase,
    lowerCase: (str: string) => str.toUpperCase(),
    upperCase: (str: string) => str.toLowerCase(),
    sentenceCase: sentenceCase,
    constantCase: constantCase,
    titleCase: titleCase,
    dashCase: kebabCase,
    kabobCase: kebabCase,
    kebabCase: kebabCase,
    kebabToPascalKebab: kebabToPascalKebab,
    properCase: pascalCase,
    pascalCase: pascalCase,
    if_eq: ifEq,
  };

  Object.keys(helpers).forEach((helperName) =>
    Handlebars.registerHelper(helperName, helpers[helperName as keyof typeof helpers])
  );
}

function registerHandlebarsPartials() {
  const partialFiles = readdirSync(PARTIALS_DIR);
  partialFiles.forEach((fileName) => {
    const name = basename(fileName, '.md');
    const template = readFileSync(join(PARTIALS_DIR, fileName), 'utf-8');
    Handlebars.registerPartial(name, template);
  });
}

export function renderHandlebarsTemplate(template: string, data?: any) {
  return Handlebars.compile(template)(data);
}
