import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';
import { getRuntimeExports, getTypeAndInterfacesExports } from './tscUtils';
import { getMinSupportedGrafanaVersion } from './minGrafanaVersion';
import { getPackageExports } from './getPackageExports';
import type { ExportInfo, MessageIds, Options } from './types';

const createRule = ESLintUtils.RuleCreator((name) => `https://my-website.io/eslint/${name}`);

let packageExports: Record<string, ExportInfo>;

export const importIsCompatible = createRule<Options, MessageIds>({
  name: 'import-is-compatible',
  meta: {
    docs: {
      description:
        'A rule that checks if the imported member is available in all Grafana runtime environments that the plugin supports.',
    },
    hasSuggestions: true,
    messages: {
      'issue:import':
        'The member "{{member}}" is not available in all runtime environments that this plugin supports. Make sure to check if the member is undefined before accessing it, or it may cause runtime errors. "{{package}}" does not export member "{{member}}".',
    },
    schema: [
      {
        type: 'object',
        properties: {
          minGrafanaVersion: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    type: 'suggestion',
  },
  defaultOptions: [{}],
  create: (context) => {
    const minSupportedVersion = getMinSupportedGrafanaVersion(context);

    // This should only ever fire once otherwise every file will re-read the package exports
    if (packageExports === undefined) {
      packageExports = getPackageExports(minSupportedVersion);
    }

    return {
      ImportSpecifier: (node) => {
        if (node?.imported?.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const identifier = node.parent.source?.value;
        if (!identifier || !(identifier in packageExports) || !Object.keys(packageExports[identifier].exports).length) {
          return;
        }

        // If the import is a type or interface, we don't need to check if it's available in the runtime
        const exportsTypesAndInterfaces = getTypeAndInterfacesExports(packageExports[identifier].exports);
        if (exportsTypesAndInterfaces.includes(node.imported.name)) {
          return;
        }

        // If the import is not a type or interface, we need to check if it's available in the runtime
        const exportsExceptTypesAndInterfaces = getRuntimeExports(packageExports[identifier].exports);
        if (exportsExceptTypesAndInterfaces.includes(node.imported.name)) {
          return;
        }

        context.report({
          node,
          data: {
            member: node.imported.name,
            package: `${identifier}@${minSupportedVersion}`,
          },
          messageId: 'issue:import',
        });
      },
    };
  },
});
