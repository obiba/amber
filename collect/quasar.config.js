/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app'
import { readFileSync } from 'node:fs'

export default defineConfig(function (ctx) {
  const packageJson = readFileSync('./package.json', 'utf8')
  const version = JSON.parse(packageJson).version || 0

  return {
    // https://quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://quasar.dev/quasar-cli-vite/boot-files
    boot: [
      'settings',
      'auth',
      'axios',
      'feathersClient',
      'i18n',
      'vuelidate',
      'recaptcha',
      'errors',
      'amber'
    ],

    // https://quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: [
      '~@fontsource-variable/sora/index.css',
      '~@fontsource-variable/instrument-sans/index.css',
      'app.scss'
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      'fontawesome-v7',
      'material-icons'
    ],

    // Full list of options: https://quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      target: {
        browser: 'baseline-widely-available',
        node: 'node22'
      },

      vueRouterMode: 'history',

      // required by Options API dependencies (@obiba/quasar-ui-amber);
      // defaults to false since @quasar/app-vite v3
      vueOptionsAPI: true,

      // Environment variables (exposed as import.meta.env.*)
      defineEnv: {
        VERSION: version
      },

      // make sure a single copy of vue is bundled (git workspace deps)
      alias: {
        vue: ctx.appPaths.resolve.app('node_modules/vue')
      },

      publicPath: '/',

      // https://quasar.dev/quasar-cli-vite/handling-vite
      extendViteConf (viteConf) {
        viteConf.base = './'
      }
    },

    // Full list of options: https://quasar.dev/quasar-cli-vite/quasar-config-file#devServer
    devServer: {
      https: false,
      port: 3090,
      open: false
    },

    // https://quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: {},

      plugins: [
        'AppFullscreen',
        'Notify',
        'LocalStorage',
        'LoadingBar'
      ]
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      pwa: false,
      prodPort: 3000
    },

    // https://quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    // (manifest is read from /src-pwa/manifest.json)
    pwa: {
      workboxMode: 'GenerateSW',
      injectPWAMetaTags: false, // icons and theme-color are declared in index.html
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',

      extendPWAGenerateSWOptions (cfg) {
        Object.assign(cfg, {
          maximumFileSizeToCacheInBytes: 5000000,
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true
        })
      }
    },

    // Full list of options: https://quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {},

    // Full list of options: https://quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true
    },

    // Full list of options: https://quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      preloadScripts: ['electron-preload'],
      bundler: 'packager',

      builder: {
        appId: 'amber-collect'
      }
    },

    // Full list of options: https://quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      extraScripts: []
    }
  }
})
