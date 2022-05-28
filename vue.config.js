const { defineConfig } = require('@vue/cli-service');
const config = require('./src/config/index.cjs');

module.exports = defineConfig({
  transpileDependencies: true,
  runtimeCompiler: true,
  devServer: {
    port: config.port,
    // proxy: 'http://localhost:3000/',
  },
  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    },
  },
});
