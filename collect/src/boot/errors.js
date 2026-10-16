import { defineBoot } from '#q-app'
import { Notify } from 'quasar'

class ErrorHandler {
  init (router) {
    this.router = router
  }

  onError (error, message) {
    console.error(error)
    if (typeof message === 'string') {
      Notify.create({
        message: message,
        color: 'negative'
      })
    } else if (message[error.name]) {
      Notify.create({
        message: message[error.name],
        color: 'negative'
      })
    } else if (message.default) {
      Notify.create({
        message: message.default,
        color: 'negative'
      })
    } else {
      Notify.create({
        message: error.message,
        color: 'negative'
      })
    }
  }
}

const errorHandler = new ErrorHandler()

export default defineBoot(async ({ router }) => {
  errorHandler.init(router)
})

export { errorHandler }
