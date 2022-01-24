// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.params.user) {
      const groupService = context.app.service('group');
      const result = await groupService.find({ query: { 
        $limit: 1000,
        users: context.params.user._id 
      }});
      if (result.total > 0) {
        context.params.groups = result.data;
      }
    }
    return context;
  };
};
