// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const groupService = context.app.service('group');

    const removeUserFromGroups = (user) => {
      const userId = user._id;
      groupService.find({
        query: {
          $limit: 100,
          users: {
            $in: [userId]
          }
        }
      })
        .then(groups => {
          if (groups.total > 0) {
            groups.data.forEach(group => {
              logger.info('Cleaning group "' + group.name + '" from removed user ' + userId);
              group.users = group.users.filter(id => String(id) !== String(userId)); // note: comparing ObjectIds
              groupService.patch(group._id, { users: group.users });
            });
          }
        })
        .catch(err => console.log(err));
    };

    if (Array.isArray(context.result)) {
      context.result.forEach(user => {
        removeUserFromGroups(user);
      });
    } else {
      removeUserFromGroups(context.result);
    }
    
    return context;
  };
};
