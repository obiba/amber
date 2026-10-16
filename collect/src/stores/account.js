import { defineStore } from 'pinia'
import userService from '../services/user'
import { t } from '../boot/i18n'
import { errorHandler } from '../boot/errors'
import { Notify } from 'quasar'

export const useAccountStore = defineStore('account', () => {
  // Actions
  async function registerUser (payload) {
    const result = await userService
      .register(
        payload.formData.firstname,
        payload.formData.lastname,
        payload.formData.language,
        payload.formData.email,
        payload.formData.password,
        payload.formData.token
      )
      .catch(err => {
        if (err.response) {
          const errorCode = err.response.data.code
          if (errorCode === 409) {
            Notify.create({
              message: t('error.account_already_exists'),
              color: 'negative'
            })
          } else if (errorCode === 400) {
            errorHandler.onError(err.response.data, t('error.create_account_invalid'))
          } else {
            Notify.create({
              message: t('error.create_account'),
              color: 'negative'
            })
          }
        }
      })

    if (result && result.status >= 201) {
      Notify.create({
        message: t('success.create_account'),
        color: 'positive'
      })
      // Note: Router needs to be accessed from component context
      return { success: true }
    }
    return { success: false }
  }

  async function forgotPassword (payload) {
    return userService
      .forgotPassword(payload.emailAddress)
      .then(() => {
        Notify.create({
          message: t('success.send_reset_password'),
          color: 'positive',
          icon: 'fas fa-check'
        })
      })
      .catch(err => {
        Notify.create({
          message: err.response.data.message,
          color: 'negative'
        })
      })
  }

  return {
    registerUser,
    forgotPassword
  }
})
