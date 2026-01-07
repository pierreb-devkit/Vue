const { defineConfig } = require('@vue/cli-service');
const CompressionPlugin = require('compression-webpack-plugin');
const config = require('./src/config/index.cjs');

module.exports = defineConfig({
  transpileDependencies: true,
  runtimeCompiler: true,
  configureWebpack: (config) => {
    if (process.argv.includes('build')) {
      config.plugins.push(
        new CompressionPlugin({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          test: /\.js$/,
        }),
      );
    }
  },
  devServer: {
    // proxy: 'http://localhost:3000/',
    port: config.port,
    setupMiddlewares(middlewares, devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      if (process.argv.includes('build')) {
        middlewares.unshift({
          name: 'serve-brotli-js',
          path: '*.js',
          middleware: (req, res, next) => {
            if (req.get('Accept-Encoding')?.includes('br')) {
              req.url += '.br';
              res.set('Content-Encoding', 'br');
              res.set('Content-Type', 'application/javascript; charset=utf-8');
            }
            next();
          },
        });
      }
      return middlewares;
    },
  },
  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    },
  },
});
