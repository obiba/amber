import { createI18n } from "vue-i18n";
import messages from "@/i18n";
import { settings } from "./settings";
import { merge } from "merge-anything";
import { Quasar } from "quasar";
import { useCookies } from "vue3-cookies";

const { cookies } = useCookies();

const defaultLocales = [
  "en",
  "fr",
  "da",
  "sv",
  "et",
  "nl",
  "pt",
  "de",
  "it",
  "fi",
  "ru",
  "el",
];

const locales = settings.i18n ? Object.keys(settings.i18n) : defaultLocales;

let detectedLocale = cookies.get("locale")
  ? cookies.get("locale") // previously selected
  : Quasar.lang.getLocale(); // browser
if (!locales.includes(detectedLocale)) {
  detectedLocale = detectedLocale.split("-")[0];
  if (!locales.includes(detectedLocale)) {
    detectedLocale = locales[0];
  }
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: detectedLocale,
  fallbackLocale: locales[0],
  globalInjection: true,
  messages: merge(messages, settings.i18n ? settings.i18n : {}),
});
const t = i18n.global.t;

export default ({ app }) => {
  // Set i18n instance on app
  app.use(i18n);
};

export { i18n, t, locales };
