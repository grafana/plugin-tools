import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { applyEdits, modify, parse } from 'jsonc-parser';
import * as recast from 'recast';
import { parseDocument } from 'yaml';
import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';
import { parseAsTypescript, printAST } from '../../utils.ast.js';
import { renderHandlebarsTemplate } from '../../../utils/utils.handlebars.js';

const { builders } = recast.types;

const CONFIG_PACKAGE = '@grafana/create-plugin-configs';
const CONFIG_MANIFEST = '.config/package.json';
const PNPM_WORKSPACE = 'pnpm-workspace.yaml';
const CONFIG_WORKSPACES = ['.config'];

// Relative specifiers the scaffolded root config files used, mapped to the config package's exports.
// Other .config imports are left alone: they keep working because the files don't move.
const SPECIFIERS: Record<string, string> = {
  './.config/tsconfig.json': `${CONFIG_PACKAGE}/tsconfig.json`,
  './.config/jest.config': `${CONFIG_PACKAGE}/jest`,
  './.config/jest.config.js': `${CONFIG_PACKAGE}/jest`,
  './.config/jest-setup': `${CONFIG_PACKAGE}/jest-setup`,
  './.config/jest-setup.js': `${CONFIG_PACKAGE}/jest-setup`,
  './.config/eslint.config.mjs': `${CONFIG_PACKAGE}/eslint`,
  './.config/.prettierrc.js': `${CONFIG_PACKAGE}/prettier`,
  './.config/playwright.config': `${CONFIG_PACKAGE}/playwright`,
  './.config/playwright.config.ts': `${CONFIG_PACKAGE}/playwright`,
  './.config/webpack/webpack.config': `${CONFIG_PACKAGE}/webpack`,
  './.config/webpack/webpack.config.ts': `${CONFIG_PACKAGE}/webpack`,
  './.config/rspack/rspack.config': `${CONFIG_PACKAGE}/rspack`,
  './.config/rspack/rspack.config.ts': `${CONFIG_PACKAGE}/rspack`,
};

const SOURCE_WRAPPERS = [
  'jest.config.js',
  'jest-setup.js',
  'eslint.config.mjs',
  '.prettierrc.js',
  'playwright.config.ts',
  'webpack.config.ts',
  'rspack.config.ts',
];

type PackageManager = 'npm' | 'pnpm' | 'yarn1' | 'yarn-berry';
type Bundler = 'webpack' | 'rspack';
type PackageJson = Record<string, unknown> & {
  workspaces?: unknown;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function templatePath(file: string) {
  return fileURLToPath(new URL(`../../../../templates/common/${file}`, import.meta.url));
}

function isEqualJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Detects the package manager from the project files, so the migration doesn't depend on the CLI's environment.
function detectPackageManager(context: Context, packageJson: PackageJson): PackageManager {
  const [name, version = ''] =
    typeof packageJson.packageManager === 'string' ? packageJson.packageManager.split('@') : [];

  if (name === 'pnpm') {
    return 'pnpm';
  }
  if (name === 'yarn') {
    return version.startsWith('1.') ? 'yarn1' : 'yarn-berry';
  }
  if (name === 'npm') {
    return 'npm';
  }
  if (context.doesFileExist('pnpm-lock.yaml')) {
    return 'pnpm';
  }
  if (context.doesFileExist('yarn.lock')) {
    return context.doesFileExist('.yarnrc.yml') ? 'yarn-berry' : 'yarn1';
  }
  return 'npm';
}

function getWorkspaceGlobs(workspaces: unknown): unknown {
  if (workspaces && typeof workspaces === 'object' && 'packages' in workspaces) {
    return workspaces.packages;
  }
  return workspaces;
}

function hasOtherWorkspaces(context: Context, packageJson: PackageJson): boolean {
  const packageJsonWorkspaces = getWorkspaceGlobs(packageJson.workspaces);
  if (packageJsonWorkspaces !== undefined && !isEqualJson(packageJsonWorkspaces, CONFIG_WORKSPACES)) {
    return true;
  }

  if (context.doesFileExist(PNPM_WORKSPACE)) {
    const pnpmWorkspace: unknown = parseDocument(context.getFile(PNPM_WORKSPACE) || '').toJS();
    const packages =
      pnpmWorkspace && typeof pnpmWorkspace === 'object' && 'packages' in pnpmWorkspace
        ? pnpmWorkspace.packages
        : undefined;
    if (packages !== undefined && !isEqualJson(packages, CONFIG_WORKSPACES)) {
      return true;
    }
  }

  return false;
}

// Inserts entries after "version" so private/workspaces sit near the top, where the scaffold puts them.
function withEntriesAfterVersion(packageJson: PackageJson, entries: Record<string, unknown>): PackageJson {
  const result: PackageJson = {};
  let inserted = false;

  for (const [key, value] of Object.entries(packageJson)) {
    if (key in entries) {
      continue;
    }
    result[key] = value;
    if (key === 'version') {
      Object.assign(result, entries);
      inserted = true;
    }
  }

  return inserted ? result : { ...result, ...entries };
}

function rewriteSpecifiers(source: string): string | undefined {
  const parsed = parseAsTypescript(source);
  if (!parsed.success) {
    return undefined;
  }

  let hasChanges = false;
  const replaceSource = (value: unknown) => {
    if (typeof value !== 'string' || !(value in SPECIFIERS)) {
      return undefined;
    }
    hasChanges = true;
    return builders.stringLiteral(SPECIFIERS[value]);
  };

  recast.types.visit(parsed.ast, {
    visitImportDeclaration(path) {
      path.node.source = replaceSource(path.node.source.value) ?? path.node.source;
      return this.traverse(path);
    },
    visitExportNamedDeclaration(path) {
      if (path.node.source) {
        path.node.source = replaceSource(path.node.source.value) ?? path.node.source;
      }
      return this.traverse(path);
    },
    visitExportAllDeclaration(path) {
      path.node.source = replaceSource(path.node.source.value) ?? path.node.source;
      return this.traverse(path);
    },
    visitCallExpression(path) {
      const { callee, arguments: args } = path.node;
      const [firstArgument] = args;
      if (callee.type === 'Identifier' && callee.name === 'require' && args.length === 1) {
        const replacement =
          firstArgument.type === 'StringLiteral' || firstArgument.type === 'Literal'
            ? replaceSource(firstArgument.value)
            : undefined;
        if (replacement) {
          args[0] = replacement;
        }
      }
      return this.traverse(path);
    },
  });

  return hasChanges ? printAST(parsed.ast) : undefined;
}

function rewriteWrappers(context: Context) {
  if (context.doesFileExist('tsconfig.json')) {
    const tsconfig = context.getFile('tsconfig.json') || '';
    const extendsValue = parse(tsconfig)?.extends;
    if (typeof extendsValue === 'string' && extendsValue in SPECIFIERS) {
      context.updateFile(
        'tsconfig.json',
        applyEdits(tsconfig, modify(tsconfig, ['extends'], SPECIFIERS[extendsValue], {}))
      );
    }
  }

  for (const wrapper of SOURCE_WRAPPERS) {
    if (!context.doesFileExist(wrapper)) {
      continue;
    }
    const rewritten = rewriteSpecifiers(context.getFile(wrapper) || '');
    if (rewritten === undefined) {
      migrationsDebug(`016-config-workspace-package: no scaffolded .config imports to rewrite in ${wrapper}`);
      continue;
    }
    context.updateFile(wrapper, rewritten);
  }
}

// Points scripts that still run the bundler config inside .config at a plugin-root wrapper instead.
function useBundlerWrapper(context: Context, packageJson: PackageJson, bundler: Bundler): PackageJson {
  const configPath = `./.config/${bundler}/${bundler}.config.ts`;
  const wrapperPath = `${bundler}.config.ts`;
  const scripts = { ...(packageJson.scripts ?? {}) };
  let usesConfigPath = false;

  for (const [name, script] of Object.entries(scripts)) {
    if (typeof script === 'string' && script.includes(`-c ${configPath}`)) {
      scripts[name] = script.replace(`-c ${configPath}`, `-c ./${wrapperPath}`);
      usesConfigPath = true;
    }
  }

  if (!usesConfigPath) {
    return packageJson;
  }

  if (!context.doesFileExist(wrapperPath)) {
    context.addFile(wrapperPath, readFileSync(templatePath(wrapperPath), 'utf-8'));
  }

  return { ...packageJson, scripts };
}

function declareWorkspace(context: Context, packageJson: PackageJson, packageManager: PackageManager): PackageJson {
  const entries: Record<string, unknown> = { private: true };
  if (packageManager !== 'pnpm') {
    entries.workspaces = CONFIG_WORKSPACES;
  }

  let updated = withEntriesAfterVersion(packageJson, entries);

  if (packageManager === 'pnpm' || packageManager === 'yarn-berry') {
    updated = {
      ...updated,
      devDependencies: { [CONFIG_PACKAGE]: 'workspace:*', ...(updated.devDependencies ?? {}) },
    };
  }

  if (packageManager === 'pnpm') {
    const pnpmWorkspace = parseDocument(context.getFile(PNPM_WORKSPACE) || '');
    pnpmWorkspace.set('packages', CONFIG_WORKSPACES);
    const content = pnpmWorkspace.toString();
    if (context.doesFileExist(PNPM_WORKSPACE)) {
      context.updateFile(PNPM_WORKSPACE, content);
    } else {
      context.addFile(PNPM_WORKSPACE, content);
    }
  }

  return updated;
}

export default function migrate(context: Context) {
  if (!context.doesFileExist('.config/.cprc.json') || !context.doesFileExist('package.json')) {
    migrationsDebug('016-config-workspace-package: not a create-plugin project, skipping');
    return context;
  }

  if (context.doesFileExist(CONFIG_MANIFEST)) {
    migrationsDebug('016-config-workspace-package: .config is already a package, skipping');
    return context;
  }

  let packageJson: PackageJson;
  try {
    packageJson = JSON.parse(context.getFile('package.json') || '');
  } catch (error) {
    migrationsDebug(`016-config-workspace-package: failed to parse package.json: ${error}`);
    return context;
  }

  if (hasOtherWorkspaces(context, packageJson)) {
    migrationsDebug('016-config-workspace-package: the plugin already declares workspaces, skipping');
    context.setMessage({
      level: 'warning',
      title: 'Skipped turning .config into a workspace package.',
      body: [
        'This plugin already declares workspaces, so create-plugin left them alone.',
        `Its config files keep importing .config by relative path, which still works.`,
      ],
    });
    return context;
  }

  const packageManager = detectPackageManager(context, packageJson);
  const bundler: Bundler = context.doesFileExist('.config/rspack/rspack.config.ts') ? 'rspack' : 'webpack';

  context.addFile(
    CONFIG_MANIFEST,
    renderHandlebarsTemplate(readFileSync(templatePath('.config/_package.json'), 'utf-8'), {
      frontendBundler: bundler,
    })
  );

  packageJson = declareWorkspace(context, packageJson, packageManager);
  packageJson = useBundlerWrapper(context, packageJson, bundler);
  context.updateFile('package.json', JSON.stringify(packageJson, null, 2) + '\n');

  rewriteWrappers(context);

  return context;
}
