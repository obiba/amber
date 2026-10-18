import { register } from "register-service-worker";
import { Notify } from "quasar";

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(import.meta.env.QUASAR_SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready(/* registration */) {
    // the runtime config files are only cached once the service worker controls the page,
    // so warm the cache now for the app to boot offline on its next launch
    const prefix = window.env?.PATH_PREFIX || "/";
    const urls = [...new Set(["env.js", `${prefix}env.js`, `${prefix}settings.json`])];
    caches.open("runtime-config").then((cache) => urls.forEach((url) => cache.add(url).catch(() => {})));
  },

  registered(/* registration */) {
    // console.log('Service worker has been registered.')
  },

  cached(/* registration */) {
    // console.log('Content has been cached for offline use.')
  },

  updatefound(/* registration */) {
    // console.log('New content is downloading.')
  },

  updated(/* registration */) {
    Notify.create({
      color: "negative",
      icon: "cached",
      message: "Updated content is available. Please refresh the page.",
      timeout: 0,
      multiLine: true,
      position: "top",
      actions: [
        {
          label: "Refresh",
          color: "yellow",
          handler: () => {
            window.location.reload();
          },
        },
        {
          label: "Dismiss",
          color: "white",
          handler: () => {},
        },
      ],
    });
  },

  offline() {
    // console.log('No internet connection found. App is running in offline mode.')
  },

  error(/* err */) {
    // console.error('Error during service worker registration:', err)
  }
});
