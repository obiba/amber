// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const accountService = require('../services/auth-management/notifier');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // it was a self signup, not an explicit addition
    if (context.params.anonymous) {
      const notifierService = accountService(context.app);
      context.app.service('user').find({
        query: {
          $limit: 100,
          role: 'administrator'
        }
      })
        .then(admins => {
          if (admins.total>0) {
            admins.data.forEach(admin => {
              notifierService.notifier('notifySignup', admin, context.result);
            });
          }
        });
    }
    return context;
  };
};
