// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const ms = require('ms');
const { NotAuthenticated } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.path !== 'user' && context.params && context.params.user && context.params.user.lastSeen) {
      const lastSeen = context.params.user.lastSeen.getTime();
      const now = Date.now();
      const activity = now - lastSeen;
      const activityTimeout = ms(context.app.get('authentication').activityTimeout);
      if (activity>activityTimeout) {
        throw new NotAuthenticated('activity timeout');
      } else {
        const userService = context.app.service('user');
        userService.patch(context.params.user._id, { lastSeen: now });
      }
    }
    return context;
  };
};
