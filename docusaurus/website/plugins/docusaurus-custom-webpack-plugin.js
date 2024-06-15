module.exports = function (_, options) {
  const { id, ...opts } = options || {};
  return {
    name: 'docusaurus-custom-webpack-plugin',
    configureWebpack(config, isServer, utils) {
      return opts;
    },
  };
};
