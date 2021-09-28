//const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return (context) => {
    const userService = context.app.service('user');
    userService.patch(context.result.user._id, { lastLoggedIn: new Date() });
  };
};