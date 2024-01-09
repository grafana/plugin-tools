const sharedConfig = require('../../jest.config.base');
const esModules = ['change-case', 'title-case'].join('|');

module.exports = {
  ...sharedConfig,
  modulePathIgnorePatterns: ['<rootDir>/templates/'],
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
};
