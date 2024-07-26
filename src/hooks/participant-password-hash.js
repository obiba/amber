const { BadRequest } = require('@feathersjs/errors');
const { hashPassword } = require('../utils/password-hasher');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    console.log(context);
    if (context.data.password && context.data.password.length > 0) {
      const authConfig = context.app.get('authentication').participant;
      if (context.data.password.length < (authConfig.passwordLength || 8)) {
        throw new BadRequest('Password too short');
      }
      const pwd = await hashPassword(context.data.password);
      context.data.password = pwd;
    }
    if (context.data.password === '') {
      context.data.password = null;
    }
    return context;
  };
};
