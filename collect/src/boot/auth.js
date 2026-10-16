import { defineBoot } from '#q-app'
import { LocalStorage, Notify } from 'quasar'
import { feathersClient } from './feathersClient'
import { t } from './i18n'
import { useAuthStore } from '../stores/auth'
import { useRecordStore } from '../stores/record'

export default defineBoot(async ({ router }) => {
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth) {
      const authStore = useAuthStore()
      const recordStore = useRecordStore()

      // if requires admin
      const user = authStore.user
      if (user) {
        if (to.meta.requiresAdmin) {
          if (user.role && user.role === 'administrator') {
            next()
          } else {
            Notify.create({
              message: 'Your account is not authorized to see this view. If this is in error, please contact support.',
              color: 'negative'
            })
            next(from.path)
          }
        } else if (!LocalStorage.getItem('feathers-jwt')) {
          next('/login')
        } else {
          // after a page reload, the stored token must be re-attached to the API requests
          // (no-op when already authenticated; pending requests wait for it)
          feathersClient.reAuthenticate().catch((err) => {
            console.error(err)
            if (err.code === 401) {
              // remove expired/unusable token
              LocalStorage.remove('feathers-jwt')
              router.push('/login')
            } else {
              // network cannot be reached: retry on next navigation
              feathersClient.set('authentication', undefined)
            }
          })
          next()
        }
      } else if (LocalStorage.getItem('feathers-jwt')) {
        if (recordStore.user) {
          next()
        } else {
          next('/loading')
        }
        // could be not expired but also still not valid, then reauth
        feathersClient.reAuthenticate().then((response) => {
          // show application page
          authStore.responseHandler(response)
          // update user identity associated to records
          recordStore.initUser(response.user)
          router.push(to.path)
        }).catch((err) => {
          console.error(err)
          if (err.response) {
            // remove expired/unusable token
            LocalStorage.remove('feathers-jwt')
            router.push('/login')
          } else {
            // network cannot be reached, go to login screen
            if (!recordStore.user) {
              router.push('/login')
            } else {
              Notify.create({
                message: t('error.network_error'),
                color: 'negative'
              })
              // router.push('/')
            }
          }
        })
      } else if (to.path !== '/login') {
        next('/login')
      } else {
        next()
      }
    } else {
      next()
    }
  })
})
