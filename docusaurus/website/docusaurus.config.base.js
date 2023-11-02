const path = require('path');
const remarkFigureCaption = require('gridsome-remark-figure-caption');
const { grafanaPrismTheme } = require('./src/theme/prism');

const customFields = {
  nodeEnv: process.env.NODE_ENV,
};

/** @type {import('@docusaurus/types').Config} */
const generalConfig = {
  title: 'Grafana Plugin Tools',
  tagline: 'Scaffold a Grafana plugin with one command',
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

const plugins = [
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
];

const presetsDocs = {
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

const presetsTheme = {
  customCss: require.resolve('./src/css/custom.css'),
};

const themeConfigNavbar = {
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

const themeConfigFooter = {
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

const themeConfigPrism = {
  theme: grafanaPrismTheme,
  additionalLanguages: ['bash', 'diff', 'json'],
};

const themeConfigColorMode = {
  defaultMode: 'dark',
  disableSwitch: true,
  respectPrefersColorScheme: false,
};

module.exports = {
  customFields,
  generalConfig,
  plugins,
  presetsDocs,
  presetsTheme,
  themeConfigNavbar,
  themeConfigFooter,
  themeConfigPrism,
  themeConfigColorMode,
};
