// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const removeGroupPermissionFromService = (group, serviceName, service) => {
      const groupId = group._id;
      service.find({
        query: {
          $limit: context.app.get('paginate').max,
          'permissions.groups': groupId
        }
      })
        .then(result => {
          if (result.total > 0) {
            result.data.forEach(item => {
              logger.info(`Cleaning ${serviceName} ${item._id} from removed group ` + groupId);
              item.permissions.groups = item.permissions.groups.filter(id => String(id) !== String(groupId)); // note: comparing ObjectIds
              if (item.permissions.groups.length === 0 && (!item.permissions.users || item.permissions.users.length === 0)) {
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
        context.result.forEach(group => {
          removeGroupPermissionFromService(group, serviceName, service);
        });
      } else {
        removeGroupPermissionFromService(context.result, serviceName, service);
      }
    });

    return context;
  };
};
