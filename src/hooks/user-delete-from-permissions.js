// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const removeUserFromService = (user, serviceName, service) => {
      const userId = user._id;
      service.find({
        query: {
          $limit: 1000,
          'permissions.users': userId
        }
      })
        .then(result => {
          if (result.total > 0) {
            result.data.forEach(item => {
              logger.info(`Cleaning ${serviceName} ${item._id} from removed user ` + userId);
              item.permissions.users = item.permissions.users.filter(id => String(id) !== String(userId)); // note: comparing ObjectIds
              if (item.permissions.users.length === 0 && (!item.permissions.groups || item.permissions.groups.length === 0)) {
                item.permissions = null;
              }
              service.patch(item._id, { permissions: item.permissions });
            });
          }
        })
        .catch(err => console.log(err));
    };

    ['case-report-form'].forEach(serviceName => {
      const service = context.app.service(serviceName);
      if (Array.isArray(context.result)) {
        context.result.forEach(user => {
          removeUserFromService(user, serviceName, service);
        });
      } else {
        removeUserFromService(context.result, serviceName, service);
      }
    });

    return context;
  };
};
