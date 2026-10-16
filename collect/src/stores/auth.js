import { defineStore } from 'pinia'
import { ref } from 'vue'
import { secureStorage } from './index'
import { feathersClient } from '../boot/feathersClient'
import { api } from '../boot/axios'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const accessToken = ref(null)
  const isAuthenticatePending = ref(false)
  const isLogoutPending = ref(false)
  const errorOnAuthenticate = ref(null)
  const errorOnLogout = ref(null)

  // Actions
  function responseHandler (response) {
    if (response && response.user) {
      user.value = response.user
    }
    if (response && response.accessToken) {
      accessToken.value = response.accessToken
    }
    return response
  }

  async function authenticate (credentials) {
    isAuthenticatePending.value = true
    errorOnAuthenticate.value = null

    try {
      const response = await feathersClient.authenticate(credentials)
      responseHandler(response)
      isAuthenticatePending.value = false
      return response
    } catch (error) {
      errorOnAuthenticate.value = error
      isAuthenticatePending.value = false
      throw error
    }
  }

  async function reAuthenticate () {
    isAuthenticatePending.value = true
    errorOnAuthenticate.value = null

    try {
      const response = await feathersClient.reAuthenticate()
      responseHandler(response)
      isAuthenticatePending.value = false
      return response
    } catch (error) {
      errorOnAuthenticate.value = error
      isAuthenticatePending.value = false
      // Clear auth state on re-auth failure
      user.value = null
      accessToken.value = null
      throw error
    }
  }

  async function logout () {
    isLogoutPending.value = true
    errorOnLogout.value = null

    try {
      await feathersClient.logout()
      user.value = null
      accessToken.value = null
      isLogoutPending.value = false
    } catch (error) {
      errorOnLogout.value = error
      isLogoutPending.value = false
      throw error
    }
  }

  function clearAuthErrors () {
    errorOnAuthenticate.value = null
    errorOnLogout.value = null
  }

  async function getOAuthProviders () {
    const response = await api.get('/auth/providers')
    return response.data
  }

  return {
    // State
    user,
    accessToken,
    isAuthenticatePending,
    isLogoutPending,
    errorOnAuthenticate,
    errorOnLogout,
    // Actions
    authenticate,
    reAuthenticate,
    logout,
    clearAuthErrors,
    getOAuthProviders
  }
}, {
  persist: {
    key: 'auth',
    storage: secureStorage,
    paths: ['user', 'accessToken']
  }
})
