// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const ms = require('ms');
const { NotAuthenticated } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.path !== 'user' && context.params && context.params.user && context.params.user.lastSeen) {
      const lastSeen = context.params.user.lastSeen;
      const now = Date.now();
      let lastSeenMs;
      if (lastSeen instanceof Date) {
        lastSeenMs = lastSeen.getTime();
      } else if (typeof lastSeen === 'string') {
        const parsed = Date.parse(lastSeen);
        lastSeenMs = Number.isNaN(parsed) ? now : parsed;
      } else if (typeof lastSeen === 'number') {
        lastSeenMs = lastSeen;
      } else {
        lastSeenMs = now;
      }
      const activity = now - lastSeenMs;
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
