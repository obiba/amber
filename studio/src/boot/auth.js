import { defineBoot } from '#q-app'
import { LocalStorage, Notify } from 'quasar'
import { useAuthStore } from '../stores/auth'

export default defineBoot(async ({ router, app }) => {
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth) {
      const authStore = useAuthStore()
      const user = authStore.user

      if (user) {
        // Check role-based access
        if (to.meta.requiresAdmin && (!user.role || user.role !== 'administrator')) {
          Notify.create({
            message: 'Your account is not authorized to see this view. If this is in error, please contact support.',
            color: 'negative'
          })
          next(from.path)
        } else if (to.meta.noGuest && (!user.role || user.role === 'guest')) {
          Notify.create({
            message: 'Your account is not authorized to see this view. If this is in error, please contact support.',
            color: 'negative'
          })
          next(from.path)
        } else if (!LocalStorage.getItem('feathers-jwt') && to.path !== '/') {
          next('/login')
        } else {
          next()
        }
      } else if (LocalStorage.getItem('feathers-jwt')) {
        // Loading page reauthenticates and redirects back
        next({ path: '/loading', query: { redirect: to.fullPath } })
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
