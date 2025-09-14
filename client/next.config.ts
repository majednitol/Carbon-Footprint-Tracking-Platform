const path = require('path');

module.exports = {
  webpack(config: { resolve: { alias: { [x: string]: any; }; }; }) {
    config.resolve.alias['@'] = path.resolve(__dirname, './');
    return config;
  },
};
