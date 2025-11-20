import { camelCase } from 'change-case';
import { convertIgnorePatternToMinimatch } from '@ivanmaxlogiudice/gitignore';
import type { Linter } from 'eslint';
import { parse } from 'jsonc-parser';
import minimist from 'minimist';
import { dirname, relative, resolve } from 'node:path';
import * as recast from 'recast';
import type { Context } from '../../context.js';
import { addDependenciesToPackageJson, migrationsDebug } from '../../utils.js';

type Imports = Map<string, { name?: string; bindings?: string[] }>;

const { builders } = recast.types;
const legacyKeysToCopy: Array<keyof Linter.ConfigOverride> = ['rules', 'settings'];
const devDependenciesToUpdate = {
  '@grafana/eslint-config': '^8.1.0',
  eslint: '^9.0.0',
  'eslint-config-prettier': '^8.8.0',
  'eslint-plugin-jsdoc': '^51.2.3',
  'eslint-plugin-react': '^7.37.5',
  'eslint-plugin-react-hooks': '^5.2.0',
  'eslint-webpack-plugin': '^5.0.0',
};

export default function migrate(context: Context): Context {
  const needsMigration = context.doesFileExist('.eslintrc');
  if (!needsMigration) {
    return context;
  }

  const discoveredConfigs = discoverRelativeLegacyConfigs(context, '.eslintrc');
  const ignorePaths = getIgnorePaths(context);

  if (context.doesFileExist('.eslintignore')) {
    context.deleteFile('.eslintignore');
  }

  for (const [legacyFilePath, legacyConfig] of discoveredConfigs.entries()) {
    const flatConfigFilePath = context.normalisePath(legacyFilePath).replace('.eslintrc', 'eslint.config.mjs');
    const flatConfig = migrateLegacyConfig(legacyConfig, legacyFilePath === '.eslintrc' ? ignorePaths : undefined);
    context.addFile(flatConfigFilePath, flatConfig);
    context.deleteFile(legacyFilePath);
  }

  if (context.getFile('package.json')) {
    const packageJsonRaw = JSON.parse(context.getFile('package.json') || '{}');
    if (packageJsonRaw.scripts) {
      const fixedEslintScripts = migrateEslintScripts(packageJsonRaw.scripts);
      packageJsonRaw.scripts = fixedEslintScripts;
      context.updateFile('package.json', JSON.stringify(packageJsonRaw, null, 2));
    }

    addDependenciesToPackageJson(context, {}, devDependenciesToUpdate);
  }

  return context;
}

export function migrateLegacyConfig(legacyConfig: Linter.LegacyConfig, ignorePatterns?: string[]) {
  const imports: Imports = new Map();

  const flatConfigFileContents = [];
  const configs = [];

  imports.set('eslint/config', { bindings: ['defineConfig'] });

  if (ignorePatterns && ignorePatterns.length > 0) {
    const ignoreArrayAST = builders.arrayExpression(ignorePatterns.map((path) => builders.literal(path)));
    const ignoreObjectAST = builders.property('init', builders.identifier('ignores'), ignoreArrayAST);

    configs.push(builders.objectExpression([ignoreObjectAST]));
  }

  configs.push(...addConfigsToMigration(imports, legacyConfig as Linter.ConfigOverride));

  if (legacyConfig.overrides) {
    legacyConfig.overrides.forEach((override) => {
      configs.push(...addConfigsToMigration(imports, override));
    });
  }

  // Once all configs are processed all required imports are available.
  const allImports = migrateImports(imports);
  flatConfigFileContents.push(...allImports);

  // Wrap the config in defineConfig
  const defineConfigNode = builders.callExpression(builders.identifier('defineConfig'), [
    builders.arrayExpression(configs),
  ]);
  // default export the defineConfig
  flatConfigFileContents.push(builders.exportDefaultDeclaration(defineConfigNode));

  return recast.print(builders.program(flatConfigFileContents), {
    tabWidth: 2,
    trailingComma: true,
    lineTerminator: '\n',
  }).code;
}

function addConfigsToMigration(imports: Imports, config: Linter.ConfigOverride) {
  const inits: recast.types.namedTypes.Property[] = [];
  const extendsNodes: Array<
    | recast.types.namedTypes.SpreadElement
    | recast.types.namedTypes.MemberExpression
    | recast.types.namedTypes.Identifier
  > = [];

  if (config.files) {
    const files = Array.isArray(config.files) ? config.files : [config.files];
    const filesArrayAST = builders.arrayExpression(files.map((file) => builders.literal(file)));
    inits.push(builders.property('init', builders.identifier('files'), filesArrayAST));
  }

  if (config.excludedFiles) {
    const excludedFiles = Array.isArray(config.excludedFiles) ? config.excludedFiles : [config.excludedFiles];
    const excludedFilesArrayAST = builders.arrayExpression(excludedFiles.map((file) => builders.literal(file)));
    inits.push(builders.property('init', builders.identifier('ignores'), excludedFilesArrayAST));
  }

  if (config.extends) {
    const extendedAST = migrateExtends(config.extends, imports);
    extendsNodes.push(...extendedAST);
  }

  if (config.parserOptions) {
    const languageOptionsAST = migrateParserOptions(config);
    if (languageOptionsAST) {
      inits.push(builders.property('init', builders.identifier('languageOptions'), languageOptionsAST));
    }
  }

  if (config.plugins) {
    const pluginsAST = migratePlugins(config.plugins, imports);
    inits.push(builders.property('init', builders.identifier('plugins'), pluginsAST));
  }

  legacyKeysToCopy.forEach((key) => {
    if (config[key]) {
      const valueAST = generateAST(config[key]);
      inits.push(builders.property('init', builders.identifier(key), valueAST));
    }
  });

  const result: Array<
    | recast.types.namedTypes.SpreadElement
    | recast.types.namedTypes.MemberExpression
    | recast.types.namedTypes.ObjectExpression
    | recast.types.namedTypes.Identifier
  > = [...extendsNodes];

  if (inits.length > 0) {
    result.push(builders.objectExpression(inits));
  }

  return result;
}

function generateAST(
  value: Object
):
  | recast.types.namedTypes.ObjectExpression
  | recast.types.namedTypes.ArrayExpression
  | recast.types.namedTypes.Literal {
  if (Array.isArray(value)) {
    return builders.arrayExpression(value.map((i) => generateAST(i)));
  }
  if (value && typeof value === 'object') {
    const props = Object.keys(value).map((key) => {
      const propValue = value[key as keyof typeof value];
      const identifier = isValidIdentifier(key) ? builders.identifier(key) : builders.literal(key);
      return builders.property('init', identifier, generateAST(propValue));
    });
    return builders.objectExpression(props);
  }
  return builders.literal(value);
}

function migrateExtends(extendsConfig: string | string[], imports: Imports) {
  const extendsArray = Array.isArray(extendsConfig) ? extendsConfig : [extendsConfig];
  const extendsNodes: Array<
    | recast.types.namedTypes.SpreadElement
    | recast.types.namedTypes.Identifier
    | recast.types.namedTypes.MemberExpression
  > = [];

  extendsArray.forEach((extend, idx) => {
    if (extend.endsWith('.eslintrc')) {
      const importName = idx ? `baseConfig${idx}` : 'baseConfig';
      const rewrittenPath = extend.replace('.eslintrc', 'eslint.config.mjs');

      extendsNodes.push(builders.spreadElement(builders.identifier(importName)));

      imports.set(rewrittenPath, { name: importName });
    } else if (!extend.match(/^\.?(\.\/)/)) {
      if (extend === '@grafana/eslint-config') {
        const importName = 'grafanaConfig';
        extendsNodes.push(builders.spreadElement(builders.identifier(importName)));

        imports.set('@grafana/eslint-config/flat.js', {
          name: importName,
        });
      } else {
        if (extend.startsWith('eslint:')) {
          const varName = extend.slice(7);
          extendsNodes.push(builders.identifier(`js.configs.${varName}`));
          imports.set('@eslint/js', { name: 'js' });
        } else if (extend.startsWith('plugin:')) {
          const extendWithoutPluginPrefix = extend.slice(7);
          const extendParts = extendWithoutPluginPrefix.split('/');
          const importName = normaliseImportedModuleName(extendParts[0]);
          const [pluginName, configName] = extendParts;
          let basePath = `${pluginName}.configs`;
          if (pluginName === 'react') {
            basePath = `${pluginName}.configs.flat`;
          }
          if (isValidIdentifier(configName)) {
            extendsNodes.push(builders.identifier(`${basePath}.${configName}`));
          } else {
            extendsNodes.push(
              builders.memberExpression(builders.identifier(basePath), builders.literal(configName), true)
            );
          }
          imports.set(importName, { name: pluginName });
        } else {
          // We assume that the extended config supports flat config format
          const varName = getPluginVarName(extend);
          let importName = normaliseImportedModuleName(extend, 'eslint-config');
          extendsNodes.push(builders.identifier(varName));

          if (varName === 'prettier') {
            importName += '/flat';
          }
          imports.set(importName, { name: varName });
        }
      }
    }
  });

  return extendsNodes;
}

function migrateParserOptions(config: Linter.ConfigOverride) {
  const props: recast.types.namedTypes.Property[] = [];

  if (config.parserOptions) {
    const { ecmaVersion, sourceType, ...rest } = config.parserOptions;

    if (ecmaVersion) {
      props.push(builders.property('init', builders.literal('ecmaVersion'), builders.literal(ecmaVersion)));
    }

    if (sourceType) {
      props.push(builders.property('init', builders.literal('sourceType'), builders.literal(sourceType)));
    }

    if (Object.keys(rest).length > 0) {
      props.push(builders.property('init', builders.identifier('parserOptions'), generateAST(rest)));
    }
  }

  return props.length > 0 ? builders.objectExpression(props) : undefined;
}

function migrateImports(imports: Imports) {
  const importNodes: recast.types.namedTypes.ImportDeclaration[] = [];
  imports.forEach(({ name, bindings }, path) => {
    importNodes.push(
      name
        ? builders.importDeclaration(
            [builders.importDefaultSpecifier(builders.identifier(name))],
            builders.literal(path)
          )
        : builders.importDeclaration(
            bindings?.map((binding) => builders.importSpecifier(builders.identifier(binding))),
            builders.literal(path)
          )
    );
  });
  return importNodes;
}

function migratePlugins(plugins: string[], imports: Imports) {
  const props: recast.types.namedTypes.Property[] = [];

  plugins.forEach((plugin) => {
    const varName = getPluginVarName(plugin);
    const importName = normaliseImportedModuleName(plugin);
    const shortPluginName = getPluginShortName(plugin);
    props.push(builders.property('init', builders.literal(shortPluginName), builders.identifier(varName)));
    imports.set(importName, { name: varName });
  });

  return builders.objectExpression(props);
}

function migrateEslintScripts(scripts: Record<string, string>) {
  for (const [scriptName, script] of Object.entries<string>(scripts)) {
    if (scriptName.includes('lint') && script.includes('eslint')) {
      const splitScript = script.split(' ');
      const parsedArgs = minimist(splitScript.slice(1));
      const argsToRemove = ['ignore-path', 'ext'];
      for (const arg of argsToRemove) {
        delete parsedArgs[arg];
      }
      let newScript = splitScript[0];

      // Eslint command line reference always suggests adding the
      for (const [key, value] of Object.entries(parsedArgs).reverse()) {
        if (key === '_') {
          newScript += ` ${value.join(' ')}`;
        } else {
          if (typeof value === 'boolean') {
            newScript += ` --${key}`;
          } else {
            newScript += ` --${key} ${value}`;
          }
        }
      }

      scripts[scriptName] = newScript;
    }
  }
  return scripts;
}

function getPluginVarName(pluginName: string) {
  let name = pluginName.replace(/^eslint-plugin-/, '');

  if (name === 'import' || name === 'export') {
    return `${name}Plugin`;
  }

  if (name.startsWith('@')) {
    name = name.substring(1);
  }

  return camelCase(name);
}

function getPluginShortName(pluginName: string) {
  if (pluginName.startsWith('@')) {
    let match = pluginName.match(/^@([^/]+)\/eslint-plugin$/);

    if (match) {
      return match[1];
    }
    match = pluginName.match(/^@([^/]+)\/eslint-plugin-(.+)$/);

    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  }
  if (pluginName.startsWith('eslint-plugin-')) {
    return pluginName.replace('eslint-plugin-', '');
  }
  return pluginName;
}

function normaliseImportedModuleName(moduleName: string, prefix = 'eslint-plugin'): string {
  if (moduleName.includes(`${prefix}-`)) {
    return moduleName;
  }
  if (!moduleName.startsWith('@')) {
    return `${prefix}-${moduleName}`;
  }
  if (!moduleName.includes('/')) {
    return `${moduleName}/${prefix}`;
  }
  const [scope, name] = moduleName.split('/');
  if (name.includes(prefix)) {
    return `${scope}/${name}`;
  }
  return `${scope}/${prefix}-${name}`;
}

function getIgnorePaths(context: Context): string[] {
  const result = new Set<string>();

  if (context.doesFileExist('.eslintignore')) {
    const eslintIgnore = context.getFile('.eslintignore');
    if (eslintIgnore) {
      const linesToAdd = addIgnoreLinesToSet(eslintIgnore);
      linesToAdd.forEach((line) => result.add(line));
    }
  }

  const packageJsonRaw = context.getFile('package.json');
  if (packageJsonRaw) {
    try {
      const packageJson = JSON.parse(packageJsonRaw);
      if (packageJson.scripts) {
        for (const [scriptName, script] of Object.entries<string>(packageJson.scripts)) {
          if (scriptName.includes('lint') && script.includes('eslint')) {
            const args = script.split(' ').slice(1);
            const parsedArgs = minimist(args);
            const ignorePath = parsedArgs['ignore-path'];

            if (ignorePath && context.doesFileExist(ignorePath)) {
              const ignorePathContent = context.getFile(ignorePath);
              if (ignorePathContent) {
                const linesToAdd = addIgnoreLinesToSet(ignorePathContent);
                linesToAdd.forEach((line) => result.add(line));
              }
            }
          }
        }
      }
    } catch (error) {
      migrationsDebug('Error parsing package.json: %s', error);
    }
  }

  return Array.from(result);
}

const isValidIdentifier = (name: string) => /^[a-z_$][0-9a-z_$]*$/iu.test(name);

const addIgnoreLinesToSet = (content: string) =>
  content
    .split('\n')
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => convertIgnorePatternToMinimatch(line.trim()));

function discoverRelativeLegacyConfigs(
  context: Context,
  configPath: string,
  discoveredConfigs: Map<string, Linter.ConfigOverride> = new Map()
): Map<string, Linter.ConfigOverride> {
  if (discoveredConfigs.has(configPath)) {
    return discoveredConfigs;
  }

  if (!context.doesFileExist(configPath)) {
    return discoveredConfigs;
  }
  const config = parseJsonConfig(context, configPath);

  discoveredConfigs.set(configPath, config);

  if (config.extends) {
    const relativeExtends = getRelativePath(config.extends, configPath);
    return relativeExtends.reduce(
      (acc, relativeExtend) => discoverRelativeLegacyConfigs(context, relativeExtend, acc),
      discoveredConfigs
    );
  }

  return discoveredConfigs;
}

// Legacy eslint configs are JSONC files, so we use jsonc-parser to parse them.
function parseJsonConfig(context: Context, legacyConfigPath: string) {
  const legacyEslintConfigRaw = context.getFile(legacyConfigPath) ?? '';
  return parse(legacyEslintConfigRaw);
}

function getRelativePath(extendsConfig: string | string[], currentFilePath: string): string[] {
  const extendsArray = Array.isArray(extendsConfig) ? extendsConfig : [extendsConfig];
  const localExtends = extendsArray.filter(isNotBareSpecifier);
  return localExtends.map((extend) => {
    const resolvedPath = resolve(dirname(currentFilePath), extend);
    return relative('.', resolvedPath);
  });
}

function isNotBareSpecifier(packageName: string) {
  const isRelative = packageName.startsWith('./') || packageName.startsWith('../') || packageName.startsWith('/');
  const isLocalFile = packageName.startsWith('.') && !packageName.startsWith('@');

  return isRelative || isLocalFile;
}
