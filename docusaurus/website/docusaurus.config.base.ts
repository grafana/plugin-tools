import type { Config } from '@docusaurus/types';
import path from 'path';
import remarkFigureCaption from 'gridsome-remark-figure-caption';
import { themes } from 'prism-react-renderer';

// Replace background and color to better match Grafana theme.
const grafanaPrismTheme = {
  ...themes.oneDark,
  plain: {
    color: 'rgb(204, 204, 220)',
    backgroundColor: '#181b1f',
  },
};

export const customFields = {
  nodeEnv: process.env.NODE_ENV,
};

export const generalConfig: Config = {
  title: 'Grafana Plugin Tools',
  tagline: 'Scaffold a Grafana plugin with one command',
  url: '',
  baseUrl: 'plugin-tools/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'grafana', // Usually your GitHub org/user name.
  projectName: 'plugin-tools', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
};

export const plugins = [
  [
    './plugins/docusaurus-custom-webpack-plugin',
    {
      resolve: {
        alias: {
          '@snippets': path.resolve(__dirname, '..', 'docs', 'snippets'),
          '@shared': path.resolve(__dirname, '..', 'docs', 'shared'),
        },
      },
    },
  ],
  [
    'docusaurus-lunr-search',
    {
      disableVersioning: true,
    },
  ],
  [
    '@docusaurus/plugin-client-redirects',
    {
      // how to use https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-client-redirects#ex-config
      // This plugin is always inactive in development and only active in production because it works on the build output.
      redirects: [
        {
          from: ['/reference-plugin-json'],
          to: '/reference/plugin-json',
        },
        {
          from: ['/introduction/backend-plugins'],
          to: '/key-concepts/backend-plugins',
        },
        {
          from: ['/introduction/data-frames'],
          to: '/key-concepts/data-frames',
        },
        {
          from: ['/introduction/grafana-plugin-sdk-for-go'],
          to: '/key-concepts/backend-plugins/grafana-plugin-sdk-for-go',
        },
        {
          from: ['/introduction'],
          to: '/key-concepts',
        },
        {
          from: ['/introduction/npm-dependencies'],
          to: '/key-concepts/npm-dependencies',
        },
        {
          from: ['/introduction/plugin-lifecycle'],
          to: '/key-concepts/plugin-lifecycle',
        },
        {
          from: ['/introduction/backend-plugins/plugin-protocol'],
          to: '/key-concepts/backend-plugins/plugin-protocol',
        },
        {
          from: ['/introduction/plugin-types-usage'],
          to: '/key-concepts/plugin-types-usage',
        },
        {
          from: ['/ui-extensions'],
          to: '/key-concepts/ui-extensions',
        },
        {
          from: ['/ui-extensions/register-an-extension'],
          to: '/how-to-guides/ui-extensions/register-an-extension',
        },
        {
          from: ['/ui-extensions/create-an-extension-point'],
          to: '/how-to-guides/ui-extensions/create-an-extension-point',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/nested-plugins'],
          to: '/how-to-guides/app-plugins/work-with-nested-plugins',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/custom-panel-option-editors'],
          to: '/how-to-guides/panel-plugins/custom-panel-option-editors',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/enable-for-annotations'],
          to: '/how-to-guides/data-source-plugins/add-support-for-annotation-queries',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/add-authentication-for-data-source-plugins'],
          to: '/how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/add-support-for-explore-queries'],
          to: '/how-to-guides/data-source-plugins/add-features-for-explore-queries',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/add-logs-metrics-traces-for-backend-plugins'],
          to: '/how-to-guides/data-source-plugins/add-logs-metrics-traces-for-backend-plugins',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/add-query-editor-help'],
          to: '/how-to-guides/data-source-plugins/add-query-editor-help',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/add-router'],
          to: '/how-to-guides/data-source-plugins/add-router',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/add-support-for-variables'],
          to: '/how-to-guides/data-source-plugins/add-support-for-variables',
        },
        {
          from: ['/create-a-plugin/develop-a-plugin/work-with-data-frames'],
          to: '/how-to-guides/data-source-plugins/create-data-frames',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/error-handling'],
          to: '/how-to-guides/data-source-plugins/error-handling',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/fetch-data-from-frontend'],
          to: '/how-to-guides/data-source-plugins/fetch-data-from-frontend',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/include-dashboards'],
          to: '/how-to-guides/data-source-plugins/include-dashboards',
        },
        {
          from: ['/create-a-plugin/develop-a-plugin/work-with-frontend'],
          to: '/reference/cli-commands/',
        },
        {
          from: ['/create-a-plugin/develop-a-plugin/work-with-backend'],
          to: '/reference/cli-commands/',
        },
        {
          from: ['/create-a-plugin/develop-a-plugin/set-up-github-workflows'],
          to: '/get-started/set-up-development-environment#set-up-github-workflows',
        },
        {
          from: ['/create-a-plugin/develop-a-plugin/subscribe-events'],
          to: '/how-to-guides/panel-plugins/subscribe-events',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/add-anonymous-usage-reporting'],
          to: '/how-to-guides/add-anonymous-usage-reporting',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/add-return-to-previous-functionality'],
          to: '/how-to-guides/app-plugins/add-return-to-previous-functionality',
        },
        {
          from: ['/create-a-plugin/extend-a-plugin/extend-configurations'],
          to: '/get-started/set-up-development-environment#extend-configurations',
        },
        {
          from: ['/migration-guides/update-create-plugin-versions'],
          to: '/reference/cli-commands/#update-plugin-tooling',
        },
        {
          from: ['/reference/prompts'],
          to: '/reference/cli-commands/',
        },
        {
          from: ['/get-started/folder-structure'],
          to: '/key-concepts/anatomy-of-a-plugin',
        },
      ],
    },
  ],
];

export const presetsDocs = {
  path: '../docs',
  exclude: ['**/snippets/**', '**/shared/**', '**/drafts/**'],
  sidebarPath: require.resolve('./sidebars.js'),
  // Please change this to your repo.
  // Remove this to remove the "edit this page" links.
  editUrl: 'https://github.com/grafana/plugin-tools/edit/main/docusaurus/website',
  beforeDefaultRemarkPlugins: [
    [
      remarkFigureCaption,
      {
        figureClassName: 'md-figure-block',
        imageClassName: 'md-figure-image',
        captionClassName: 'md-figure-caption',
      },
    ],
  ],
};

export const presetsTheme = {
  customCss: require.resolve('./src/css/custom.css'),
};

export const themeConfigNavbar = {
  title: 'Grafana Plugin Tools',
  logo: {
    alt: 'Grafana Logo',
    src: 'img/logo.svg',
  },
  items: [
    { href: 'https://community.grafana.com/c/plugin-development/30', label: 'Help', position: 'right' },
    {
      href: 'https://www.github.com/grafana/plugin-tools',
      label: 'GitHub',
      position: 'right',
    },
  ],
};

export const themeConfigFooter = {
  style: 'dark',
  links: [
    {
      title: 'Docs',
      items: [
        {
          label: 'Get Started',
          to: '/',
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          label: 'Stack Overflow',
          href: 'https://stackoverflow.com/questions/tagged/grafana',
        },
        {
          label: 'Github Discussions',
          href: 'https://www.github.com/grafana/plugin-tools/discussions',
        },
        {
          label: 'Grafana Community Forums',
          href: 'https://community.grafana.com/c/plugin-development/30',
        },
      ],
    },
    {
      title: 'Social',
      items: [
        {
          label: 'GitHub',
          href: 'https://www.github.com/grafana/plugin-tools',
        },
      ],
    },
  ],
  copyright: `Copyright © ${new Date().getFullYear()} Grafana Labs. Built with Docusaurus.`,
};

export const themeConfigPrism = {
  theme: grafanaPrismTheme,
  additionalLanguages: ['bash', 'diff', 'json'],
  magicComments: [
    {
      className: 'code-block-addition-highlighted-line',
      line: 'addition-highlight-next-line',
      block: { start: 'addition-highlight-start', end: 'addition-highlight-end' },
    },
  ],
};

export const themeConfigColorMode = {
  defaultMode: 'dark',
  disableSwitch: true,
  respectPrefersColorScheme: false,
};

// module.exports = {
//   customFields,
//   generalConfig,
//   plugins,
//   presetsDocs,
//   presetsTheme,
//   themeConfigNavbar,
//   themeConfigFooter,
//   themeConfigPrism,
//   themeConfigColorMode,
// };
