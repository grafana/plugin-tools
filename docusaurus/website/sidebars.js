/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

const { env } = require('process');

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Introduction',
      collapsed: true,
      items: [
        'introduction/backend-plugins',
        'introduction/grafana-plugin-sdk-for-go',
        'introduction/plugin-protocol',
        'introduction/data-frames',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started',
        'creating-a-plugin',
        'folder-structure',
        'updating-to-new-releases',
        'migrating-from-toolkit',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      collapsed: true,
      items: [
        'frontend',
        'backend',
        {
          type: 'doc',
          label: 'Dev env',
          id: 'docker'
        },
        'ci',
      ], 
    },
    {
      type: 'category',
      label: 'Distribution',
      items: [
        'distributing-your-plugin',
        'signing-your-plugin',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Usage',
      items: [
        'advanced-configuration',
        'nested-plugins',
      ],
    },
  ],
};

module.exports = sidebars;
