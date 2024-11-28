const { resolve } = require('node:path');

const cwd = process.cwd();

console.log(resolve(cwd, '.config/webpack/webpack.config.ts'));

module.exports = {
  entry: [resolve(cwd, 'src/module.{js,ts,tsx}')],
  project: [resolve(cwd, 'src/**/*'), resolve(cwd, 'tests/**/*'), resolve(cwd, '.config/**/*')],
  eslint: {
    config: [resolve(cwd, '.config/.eslintrc'), resolve(cwd, './.eslintrc')],
  },
  webpack: {
    config: [resolve(cwd, '.config/webpack/webpack.config.ts')],
  },
};
