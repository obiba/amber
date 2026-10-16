/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from "#q-app";
import { readFileSync } from "node:fs";
import { feathersPiniaAutoImport } from "feathers-pinia";
import AutoImport from "unplugin-auto-import/vite";

const packageJson = readFileSync("./package.json");
const version = JSON.parse(packageJson).version || 0;

export default defineConfig(function (ctx) {
  return {
    // https://quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://quasar.dev/quasar-cli-vite/boot-files
    boot: [
      "settings",
      "i18n",
      "axios",
      "feathers-pinia",
      "vuelidate",
      "recaptcha",
      "amber",
    ],

    // https://quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: [
      "~@fontsource-variable/sora/index.css",
      "~@fontsource-variable/instrument-sans/index.css",
      "app.scss",
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      "fontawesome-v6",
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!
      "material-icons", // optional, you are not bound to it
    ],

    // Full list of options: https://quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      target: {
        browser: "baseline-widely-available",
        node: "node22",
      },

      vueRouterMode: "history", // available values: 'hash', 'history'

      // required by Options API dependencies (@obiba/quasar-ui-amber);
      // defaults to false since @quasar/app-vite v3
      vueOptionsAPI: true,

      publicPath: "/",

      // Environment variables (exposed as import.meta.env.*)
      defineEnv: {
        VERSION: version,
      },

      // make sure a single copy of vue is bundled (git workspace deps)
      alias: {
        vue: ctx.appPaths.resolve.app("node_modules/vue"),
      },

      // https://quasar.dev/quasar-cli-vite/handling-vite
      extendViteConf(viteConf) {
        viteConf.base = "./";
      },

      vitePlugins: [
        AutoImport({
          imports: [
            "vue",
            "vue-router",
            "vue-i18n",
            "vue/macros",
            feathersPiniaAutoImport,
          ],
          dts: "src/auto-imports.d.ts",
          dirs: ["src/composables", "src/models", "src/stores"],
          vueTemplate: true,
          eslintrc: {
            enabled: true, // Default `false`
            filepath: "./.eslintrc-auto-import.json", // Default `./.eslintrc-auto-import.json`
            globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
          },
        }),
      ],
    },

    // Full list of options: https://quasar.dev/quasar-cli-vite/quasar-config-file#devServer
    devServer: {
      https: false,
      port: 3070,
      open: false, // opens browser window automatically
    },

    // https://quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: {},

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en', // Quasar language pack

      // Quasar plugins
      plugins: ["AppFullscreen", "Notify", "LocalStorage", "LoadingBar"],
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      pwa: false,
      prodPort: 3000,
    },

    // https://quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: "GenerateSW", // 'GenerateSW' or 'InjectManifest'
      injectPWAMetaTags: true,
      swFilename: "sw.js",
      manifestFilename: "manifest.json",
      useCredentialsForManifestTag: false,
    },

    // Full list of options: https://quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {},

    // Full list of options: https://quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // Full list of options: https://quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      preloadScripts: ["electron-preload"],
      inspectPort: 5858,

      bundler: "packager", // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
      },

      builder: {
        // https://www.electron.build/configuration/configuration
        appId: "amber-visit",
      },
    },

    // Full list of options: https://quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      extraScripts: [],
    },
  };
});
