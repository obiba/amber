// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
// const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify that study exists
    const studyService = context.app.service('study');
    await studyService.get(context.data.study);
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
