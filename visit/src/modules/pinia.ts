import { createPinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import SecureLS from "secure-ls";

const pinia = createPinia();
const debug = false;
pinia.use(
  debug
    ? createPersistedState()
    : createPersistedState({
        storage: {
          getItem: (key) => {
            return new SecureLS({ isCompression: false }).get(key);
          },
          setItem: (key, value) => {
            new SecureLS({ isCompression: false }).set(key, value);
          },
        },
      })
);

export { pinia };
