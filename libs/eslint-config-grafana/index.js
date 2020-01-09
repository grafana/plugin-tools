'use strict';

module.exports = {
  'overrides': [
    {
      'extends': ['./config-js.js'],
      'files': ['*.js']
    },
    {
      'extends': ['./config-ts.js'],
      'files': ['*.ts']
    },
    {
      'extends': ['./config-tsx.js'],
      'files': ['*.tsx']
    }
  ]
};
