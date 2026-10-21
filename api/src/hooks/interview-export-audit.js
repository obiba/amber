// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const { accessorOf } = require('../utils/audit');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const auditService = context.app.service('audit');
    // who accessed, by name too
    auditService.create({
      ...accessorOf(context.params),
      service: 'interview-export',
      query: JSON.stringify(context.params.query),
      data: context.result.audit
    });
    return context;
  };
};
