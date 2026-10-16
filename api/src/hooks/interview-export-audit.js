// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const auditService = context.app.service('audit');
    // Set created by the logged in user
    auditService.create({
      accessedBy: context.params.user._id,
      service: 'interview-export',
      query: JSON.stringify(context.params.query),
      data: context.result.audit
    });
    return context;
  };
};
