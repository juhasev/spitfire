const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // ESLint v10 removed the `extensions` option that @vue/cli-plugin-eslint
  // still passes; skip the webpack-time lint pass and run `npm run lint`
  // manually (after the toolchain catches up) instead.
  lintOnSave: false,
  chainWebpack: (config) => {
    // postcss-discard-duplicates (used by css-minimizer-webpack-plugin)
    // crashes on Vuetify 4 / @mdi/font CSS in this toolchain combo.
    // Drop just the CSS minimizer; JS minification still runs.
    config.optimization.minimizers.delete('css')
  },
  pluginOptions: {
    vuetify: {
      autoImport: true,
    },
  },
})
