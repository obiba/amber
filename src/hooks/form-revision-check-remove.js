// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const { FeathersError } = require('@feathersjs/errors');

class FormRevisionHasCaseReports extends FeathersError {
  constructor(message, data) {
    super(message, 'FormRevisionHasCaseReports', 400, 'bad-request', data);
  }
}

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    if (context.id) {
      const formRevision = await context.app.service('form-revision').get(context.id);
      const result = await context.app.service('case-report').find({
        query: {
          $limit: 0,
          form: formRevision.form.toString(),
          revision: formRevision.revision
        }
      });
      if (result.total>0) {
        const form = await context.app.service('form').get(formRevision.form);
        throw new FormRevisionHasCaseReports(`Some case reports are associated to the form ${form.name} with revision ${formRevision.revision}`, {
          id: context.id,
          form: form._id.toString(),
          name: form.name,
          revision: formRevision.revision
        });
      }
    } else if (context.params.query) {
      const formRevisionsResult = await context.app.service('form-revision').find(context.params);
      for (let formRevision of formRevisionsResult.data) {
        const result = await context.app.service('case-report').find({
          query: {
            $limit: 0,
            form: formRevision.form.toString(),
            revision: formRevision.revision
          }
        });
        if (result.total>0) {
          const form = await context.app.service('form').get(formRevision.form);
          throw new FormRevisionHasCaseReports(`Some case reports are associated to the form ${form.name} with revision ${formRevision.revision}`, {
            id: formRevision._id.toString(),
            form: form._id.toString(),
            name: form.name,
            revision: formRevision.revision
          });
        }
      }
    }
    
    return context;
  };
};
