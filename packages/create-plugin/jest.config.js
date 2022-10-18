const sharedConfig = require('../../jest.config.base');
module.exports = {
  ...sharedConfig,
  modulePathIgnorePatterns: ['<rootDir>/templates/'],
};
