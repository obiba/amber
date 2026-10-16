import { Dark } from 'quasar'

const appEnv = window.env
const settings = {}

const response = await fetch(`${appEnv.PATH_PREFIX}settings.json`)
if (response.ok) {
  Object.assign(settings, await response.json())
}

settings.version = import.meta.env.VERSION
settings.register_enabled = appEnv.RECAPTCHA_SITE_KEY !== undefined

// dark flavor of the OBiBa theme, applied app-wide
Dark.set(settings.theme?.dark === true)

export { settings }