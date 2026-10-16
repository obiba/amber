// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const groupService = context.app.service('group');
    const userId = context.result._id; 
    const email = context.result.email;
    const domain = email.split('@')[1];
    const groups = await groupService.find({
      query: {
        $limit: 1,
        name: domain
      }
    });
    if (groups.total === 0) {
      logger.info('Creating group: ' + domain);
      groupService.create({ name: domain, users: [ userId ] });
    } else {
      logger.info('Updating group: ' + domain);
      const group = groups.data[0];
      group.users.push(userId);
      groupService.patch(group._id, { users: group.users });
    }
    return context;
  };
};
