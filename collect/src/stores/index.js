import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import SecureLS from 'secure-ls'

const ls = new SecureLS({ isCompression: false })

// Custom storage for encrypted persistence
const secureStorage = {
  getItem: (key) => {
    const value = ls.get(key)
    return value
  },
  setItem: (key, value) => {
    ls.set(key, value)
  },
  removeItem: (key) => {
    ls.remove(key)
  }
}

export default function (/* { ssrContext } */) {
  const pinia = createPinia()

  // Configure persistence plugin with encryption
  pinia.use(piniaPluginPersistedstate)

  return pinia
}

export { secureStorage }
