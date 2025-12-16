import * as recast from 'recast';
import * as babelParser from 'recast/parsers/babel-ts.js';

import type { Context } from '../../../context.js';
import { addDependenciesToPackageJson, additionsDebug } from '../../../utils.js';

const { builders } = recast.types;

export function addI18nDependency(context: Context): void {
  addDependenciesToPackageJson(context, { '@grafana/i18n': '^12.2.2' }, {});
  additionsDebug('Added @grafana/i18n dependency version ^12.2.2');
}

export function addSemverDependency(context: Context): void {
  // Add semver as regular dependency and @types/semver as dev dependency
  addDependenciesToPackageJson(context, { semver: '^7.6.0' }, { '@types/semver': '^7.5.0' });
  additionsDebug('Added semver dependency');
}

export function addI18nextCli(context: Context): void {
  // Add i18next-cli as dev dependency
  addDependenciesToPackageJson(context, {}, { 'i18next-cli': '^1.1.1' });

  // Add i18n-extract script to package.json
  const packageJsonRaw = context.getFile('package.json');
  if (!packageJsonRaw) {
    return;
  }

  try {
    const packageJson = JSON.parse(packageJsonRaw);

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    // Defensive: only add if not already present
    if (!packageJson.scripts['i18n-extract']) {
      packageJson.scripts['i18n-extract'] = 'i18next-cli extract --sync-primary';
      context.updateFile('package.json', JSON.stringify(packageJson, null, 2));
      additionsDebug('Added i18n-extract script to package.json');
    } else {
      additionsDebug('i18n-extract script already exists, skipping');
    }
  } catch (error) {
    additionsDebug('Error adding i18n-extract script:', error);
  }
}

export function updateEslintConfig(context: Context): void {
  if (!context.doesFileExist('eslint.config.mjs')) {
    additionsDebug('eslint.config.mjs not found, skipping');
    return;
  }

  const eslintConfigRaw = context.getFile('eslint.config.mjs');
  if (!eslintConfigRaw) {
    return;
  }

  // Defensive: check if @grafana/i18n eslint plugin is already configured
  if (eslintConfigRaw.includes('@grafana/i18n/eslint-plugin')) {
    additionsDebug('ESLint i18n rule already configured');
    return;
  }

  try {
    const ast = recast.parse(eslintConfigRaw, {
      parser: babelParser,
    });

    // Find the import section and add the plugin import
    const imports = ast.program.body.filter((node: any) => node.type === 'ImportDeclaration');
    const lastImport = imports[imports.length - 1];

    // Always create the plugin import
    const pluginImport = builders.importDeclaration(
      [builders.importDefaultSpecifier(builders.identifier('grafanaI18nPlugin'))],
      builders.literal('@grafana/i18n/eslint-plugin')
    );

    if (lastImport) {
      const lastImportIndex = ast.program.body.indexOf(lastImport);
      ast.program.body.splice(lastImportIndex + 1, 0, pluginImport);
    } else {
      // No imports found, insert at the beginning
      ast.program.body.unshift(pluginImport);
    }

    // Find the defineConfig array and add the plugin config
    recast.visit(ast, {
      visitCallExpression(path: any) {
        if (path.node.callee.name === 'defineConfig' && path.node.arguments[0]?.type === 'ArrayExpression') {
          const configArray = path.node.arguments[0];

          // Add the grafana i18n config object
          const i18nConfig = builders.objectExpression([
            builders.property('init', builders.identifier('name'), builders.literal('grafana/i18n-rules')),
            builders.property(
              'init',
              builders.identifier('plugins'),
              builders.objectExpression([
                builders.property('init', builders.literal('@grafana/i18n'), builders.identifier('grafanaI18nPlugin')),
              ])
            ),
            builders.property(
              'init',
              builders.identifier('rules'),
              builders.objectExpression([
                builders.property(
                  'init',
                  builders.literal('@grafana/i18n/no-untranslated-strings'),
                  builders.arrayExpression([
                    builders.literal('error'),
                    builders.objectExpression([
                      builders.property(
                        'init',
                        builders.identifier('calleesToIgnore'),
                        builders.arrayExpression([builders.literal('^css$'), builders.literal('use[A-Z].*')])
                      ),
                    ]),
                  ])
                ),
                builders.property(
                  'init',
                  builders.literal('@grafana/i18n/no-translation-top-level'),
                  builders.literal('error')
                ),
              ])
            ),
          ]);

          configArray.elements.push(i18nConfig);
        }
        this.traverse(path);
      },
    });

    const output = recast.print(ast, {
      tabWidth: 2,
      trailingComma: true,
      lineTerminator: '\n',
    }).code;

    context.updateFile('eslint.config.mjs', output);
    additionsDebug('Updated eslint.config.mjs with i18n linting rules');
  } catch (error) {
    additionsDebug('Error updating eslint.config.mjs:', error);
  }
}
