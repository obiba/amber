import axios from 'axios'
import { LoadingBar } from 'quasar'

const appEnv = window.env;
const baseURL = appEnv.AMBER_URL || 'http://localhost:3000'
const api = axios.create({ baseURL: baseURL })

api.defaults.withCredentials = true

LoadingBar.setDefaults({
  color: 'secondary',
  size: '15px',
  position: 'top'
})

api.interceptors.request.use(
  function (config) {
    LoadingBar.start()
    return config
  },
  function (error) {
    LoadingBar.stop()
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  function (response) {
    LoadingBar.stop()
    return response
  },
  function (error) {
    LoadingBar.stop()
    return Promise.reject(error)
  }
)

export { api, axios, baseURL }
