import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'doc',
      id: 'get-started',
      label: 'Get started',
    },

    // Set up
    {
      type: 'category',
      label: 'Set up your environment',
      link: {
        type: 'doc',
        id: 'set-up/set-up-development-environment',
      },
      collapsed: true,
      items: ['set-up/set-up-docker', 'set-up/set-up-github'],
    },

    // Concepts
    {
      type: 'category',
      label: 'Key concepts',
      link: {
        type: 'doc',
        id: 'key-concepts/key-concepts',
      },
      collapsed: true,
      items: [
        'key-concepts/best-practices',
        'key-concepts/plugin-types-usage',
        'key-concepts/anatomy-of-a-plugin',
        {
          type: 'category',
          label: 'Plugin backend system',
          description: 'Learn about developing Grafana plugins with a backend component.',
          link: {
            type: 'doc',
            id: 'key-concepts/backend-plugins/backend-plugins',
          },
          items: [
            'key-concepts/backend-plugins/grafana-plugin-sdk-for-go',
            'key-concepts/backend-plugins/plugin-protocol',
          ],
        },
        'key-concepts/plugin-lifecycle',
        'key-concepts/data-frames',
        'key-concepts/npm-dependencies',
        'key-concepts/plugin-i18n-concept',
      ],
    },

    // Tutorials
    {
      type: 'category',
      label: 'Tutorials',
      link: {
        type: 'doc',
        id: 'tutorials/tutorials',
      },
      items: [
        'tutorials/build-a-data-source-plugin',
        'tutorials/build-a-streaming-data-source-plugin',
        'tutorials/build-a-data-source-backend-plugin',
        'tutorials/build-a-logs-data-source-plugin',
        'tutorials/build-an-app-plugin',
        'tutorials/build-a-panel-plugin',
      ],
    },

    // Data Source plugins
    {
      type: 'category',
      label: 'Data source plugins',
      description: 'Guides for optimizing and adding capabilities to data source plugins.',
      link: {
        type: 'doc',
        id: 'how-to-guides/data-source-plugins/data-source-plugins',
      },
      items: [
        'how-to-guides/data-source-plugins/add-support-for-annotation-queries',
        'how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins',
        'how-to-guides/data-source-plugins/add-features-for-explore-queries',
        'how-to-guides/data-source-plugins/add-logs-metrics-traces-for-backend-plugins',
        'how-to-guides/data-source-plugins/add-migration-handler-for-backend-data-source',
        'how-to-guides/data-source-plugins/add-query-editor-help',
        'how-to-guides/data-source-plugins/add-resource-handler',
        'how-to-guides/data-source-plugins/add-router',
        'how-to-guides/data-source-plugins/add-support-for-externally-shared-dashboards',
        'how-to-guides/data-source-plugins/add-support-for-pdc',
        'how-to-guides/data-source-plugins/add-support-for-variables',
        'how-to-guides/data-source-plugins/convert-a-frontend-datasource-to-backend',
        'how-to-guides/data-source-plugins/create-data-frames',
        'how-to-guides/data-source-plugins/error-handling',
        'how-to-guides/data-source-plugins/fetch-data-from-frontend',
        'how-to-guides/data-source-plugins/include-dashboards',
        'how-to-guides/data-source-plugins/profile-backend-plugin',
        'how-to-guides/data-source-plugins/sql-requirements',
      ],
    },

    // App plugins
    {
      type: 'category',
      label: 'App plugins',
      description: 'Guides for optimizing and adding capabilities to app plugins.',
      link: {
        type: 'doc',
        id: 'how-to-guides/app-plugins/app-plugins',
      },
      items: [
        'how-to-guides/app-plugins/add-authentication-for-app-plugins',
        'how-to-guides/app-plugins/add-backend-component',
        'how-to-guides/app-plugins/add-resource-handler',
        'how-to-guides/app-plugins/add-return-to-previous-functionality',
        'how-to-guides/app-plugins/error-handling-in-app-plugins',
        'how-to-guides/app-plugins/implement-rbac-in-app-plugins',
        'how-to-guides/app-plugins/include-dashboards-in-app-plugins',
        'how-to-guides/app-plugins/use-llms-and-mcp',
        'how-to-guides/app-plugins/use-a-service-account',
        'how-to-guides/app-plugins/work-with-nested-plugins',
        'how-to-guides/app-plugins/include-page-behind-feature-toggle',
      ],
    },

    // Panel plugins
    {
      type: 'category',
      label: 'Panel plugins',
      description: 'Guides for optimizing and adding capabilities to panel plugins.',
      link: {
        type: 'doc',
        id: 'how-to-guides/panel-plugins/panel-plugins',
      },
      items: [
        'how-to-guides/panel-plugins/add-datalinks-support',
        'how-to-guides/panel-plugins/custom-panel-option-editors',
        'how-to-guides/panel-plugins/error-handling-for-panel-plugins',
        'how-to-guides/panel-plugins/interpolate-variables',
        'how-to-guides/panel-plugins/migration-handler-for-panels',
        'how-to-guides/panel-plugins/read-data-from-a-data-source',
        'how-to-guides/panel-plugins/subscribe-events',
      ],
    },

    // Extensions
    {
      type: 'category',
      label: 'UI extensions',
      description: 'Guides for creating UI extensions and extension points.',
      link: {
        type: 'doc',
        id: 'how-to-guides/ui-extensions/ui-extensions',
      },
      items: [
        'how-to-guides/ui-extensions/ui-extensions-concepts',
        'how-to-guides/ui-extensions/create-an-extension-point',
        'how-to-guides/ui-extensions/extension-user-render-component',
        'how-to-guides/ui-extensions/extension-user-use-function',
        'how-to-guides/ui-extensions/use-an-exposed-component',
        'how-to-guides/ui-extensions/register-an-extension',
        'how-to-guides/ui-extensions/expose-a-component',
        'how-to-guides/ui-extensions/versioning-extensions',
        'how-to-guides/ui-extensions/degregate-ui',
        'how-to-guides/ui-extensions/debug-logs',
        'how-to-guides/ui-extensions/local-development-setup',
      ],
    },

    // How to
    {
      type: 'category',
      label: 'How-to guides',
      link: {
        type: 'doc',
        id: 'how-to-guides/how-to-guides',
      },
      items: [
        'how-to-guides/add-anonymous-usage-reporting',
        'how-to-guides/add-user-storage',
        'how-to-guides/extend-configurations',
        {
          type: 'category',
          label: 'Translate your plugin',
          description: 'Translate your plugins',
          link: {
            type: 'doc',
            id: 'how-to-guides/plugin-internationalization',
          },
          items: ['how-to-guides/plugin-internationalization-grafana-11'],
        },
        'how-to-guides/runtime-checks',
        'how-to-guides/updating-a-plugin',
        'how-to-guides/debugging-plugins',
      ],
    },

    // Test
    {
      type: 'category',
      label: 'E2E test a plugin',
      description: 'Test a Grafana plugin using the @grafana/plugin-e2e tool.',
      link: {
        type: 'doc',
        id: 'e2e-test-a-plugin/e2e-test-a-plugin',
      },
      items: [
        'e2e-test-a-plugin/get-started',
        'e2e-test-a-plugin/api',
        'e2e-test-a-plugin/selecting-elements',
        'e2e-test-a-plugin/ci',
        'e2e-test-a-plugin/use-authentication',
        'e2e-test-a-plugin/feature-toggles',
        'e2e-test-a-plugin/setup-resources',
        {
          type: 'category',
          label: 'Test an app plugin',
          description: 'How to test an app plugin with @grafana/plugin-e2e',
          link: {
            type: 'doc',
            id: 'e2e-test-a-plugin/test-an-app-plugin/introduction',
          },
          items: [
            'e2e-test-a-plugin/test-an-app-plugin/app-pages',
            'e2e-test-a-plugin/test-an-app-plugin/app-configurations',
          ],
        },
        {
          type: 'category',
          label: 'Test a data source plugin',
          description: 'How to test a data source plugin with @grafana/plugin-e2e',
          link: {
            type: 'doc',
            id: 'e2e-test-a-plugin/test-a-data-source-plugin/introduction',
          },
          items: [
            'e2e-test-a-plugin/test-a-data-source-plugin/configurations',
            'e2e-test-a-plugin/test-a-data-source-plugin/data-queries',
            'e2e-test-a-plugin/test-a-data-source-plugin/variable-queries',
            'e2e-test-a-plugin/test-a-data-source-plugin/annotation-queries',
            'e2e-test-a-plugin/test-a-data-source-plugin/alert-queries',
          ],
        },
        'e2e-test-a-plugin/test-a-panel-plugin',
        'e2e-test-a-plugin/migrate-from-grafana-e2e',
      ],
    },

    // Publish
    {
      type: 'category',
      label: 'Publish a plugin',
      link: {
        type: 'doc',
        id: 'publish-a-plugin/publish-plugin-intro',
      },
      items: [
        'publish-a-plugin/publishing-best-practices',
        'publish-a-plugin/build-automation',
        'publish-a-plugin/package-a-plugin',
        'publish-a-plugin/sign-a-plugin',
        'publish-a-plugin/publish-a-plugin',
        'publish-a-plugin/provide-test-environment',
        'publish-a-plugin/publish-faqs',
      ],
    },

    // Migration Guides
    {
      type: 'category',
      label: 'Migration guides',
      link: {
        type: 'doc',
        id: 'migration-guides/migration-guides',
      },
      items: [
        {
          type: 'category',
          label: 'Update from Grafana versions',
          description: 'How to handle breaking changes between Grafana versions in your plugin.',
          link: {
            type: 'doc',
            id: 'migration-guides/update-from-grafana-versions/migration-from-grafana',
          },
          items: [
            'migration-guides/update-from-grafana-versions/migrate-11_6_x-to-12_0_x',
            'migration-guides/update-from-grafana-versions/migrate-11_5_x-to-11_6_x',
            'migration-guides/update-from-grafana-versions/migrate-10_x-to-11_x',
            'migration-guides/update-from-grafana-versions/migrate-10_0_x-to-10_1_x',
            'migration-guides/update-from-grafana-versions/migrate-9_x-to-10_x',
            'migration-guides/update-from-grafana-versions/migrate-9_3_x-to-9_4_x',
            'migration-guides/update-from-grafana-versions/migrate-9_1_x-to-9_2_x',
            'migration-guides/update-from-grafana-versions/migrate-8_x-to-9_x',
            'migration-guides/update-from-grafana-versions/migrate-8_3_x-to-8_4_x',
            'migration-guides/update-from-grafana-versions/migrate-7_x-to-8_x',
            'migration-guides/update-from-grafana-versions/migrate-6_x-to-7_0',
          ],
        },
        {
          type: 'category',
          label: 'Migrate from AngularJS to React',
          description: 'How to migrate your plugin from the legacy AngularJS framework to our React based platform.',
          link: {
            type: 'doc',
            id: 'migration-guides/angular-react/migrate-angularjs-to-react',
          },
          items: [
            'migration-guides/angular-react/angular-react-convert-from-kbn',
            'migration-guides/angular-react/angular-react-convert-mappings',
            'migration-guides/angular-react/custom-config-components',
            'migration-guides/angular-react/migrate-angularjs-configuration-settings-to-react',
            'migration-guides/angular-react/angular-react-convert-from-time_series2',
            'migration-guides/angular-react/targeting-older-releases',
            'migration-guides/angular-react/add-suggestion-supplier',
          ],
        },
        'migration-guides/migrate-from-toolkit',
      ],
    },

    // Troubleshooting
    {
      type: 'doc',
      id: 'troubleshooting',
      label: 'Troubleshooting',
    },

    // Reference & Resources
    {
      type: 'category',
      label: 'Reference',
      link: {
        type: 'doc',
        id: 'reference/plugin-reference',
      },
      items: [
        'plugin-examples/plugin-examples',
        'reference/plugin-json',
        'reference/cli-commands',
        {
          type: 'category',
          label: 'UI extensions reference',
          description: 'Reeference guides for UI extensions.',
          link: {
            type: 'doc',
            id: 'reference/ui-extensions-reference/ui-extensions-reference',
          },
          items: [
            'reference/ui-extensions-reference/extension-points',
            'reference/ui-extensions-reference/ui-extensions',
            'reference/ui-extensions-reference/extensions-api-deprecated',
          ],
        },
      ],
    },
    {
      type: 'doc',
      id: 'resources',
    },
  ],
};

export default sidebars;
