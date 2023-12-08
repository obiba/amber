// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const { FeathersError } = require('@feathersjs/errors');

class FormRevisionRemoveError extends FeathersError {
  constructor(message, data) {
    super(message, 'FormRevisionRemoveError', 400, 'bad-request', data);
  }
}

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    async function checkCaseReports(formRevision) {
      const result = await context.app.service('case-report').find({
        query: {
          $limit: 0,
          form: formRevision.form.toString(),
          revision: formRevision.revision
        }
      });
      if (result.total>0) {
        const form = await context.app.service('form').get(formRevision.form);
        throw new FormRevisionRemoveError(`Some case reports (${result.total}) are associated to the form ${form.name} with revision ${formRevision.revision}`, {
          id: formRevision._id.toString(),
          form: form._id.toString(),
          name: form.name,
          revision: formRevision.revision,
          type: 'case-report',
          count: result.total
        });
      }
    }

    async function checkCaseReportForms(formRevision) {
      const result = await context.app.service('case-report-form').find({
        query: {
          $limit: 0,
          form: formRevision.form.toString(),
          revision: formRevision.revision
        }
      });
      if (result.total>0) {
        const form = await context.app.service('form').get(formRevision.form);
        throw new FormRevisionRemoveError(`Some case report forms (${result.total}) are associated to the form ${form.name} with revision ${formRevision.revision}`, {
          id: formRevision._id.toString(),
          form: form._id.toString(),
          name: form.name,
          revision: formRevision.revision,
          type: 'case-report-form',
          count: result.total
        });
      }
    }

    async function checkInterviews(formRevision) {
      const result = await context.app.service('case-report').find({
        query: {
          $limit: 0,
          'steps.form': formRevision.form.toString(),
          'steps.revision': formRevision.revision
        }
      });
      if (result.total>0) {
        const form = await context.app.service('form').get(formRevision.form);
        throw new FormRevisionRemoveError(`Some interviews (${result.total}) are associated to the form ${form.name} with revision ${formRevision.revision}`, {
          id: formRevision._id.toString(),
          form: form._id.toString(),
          name: form.name,
          revision: formRevision.revision,
          type: 'interview',
          count: result.total
        });
      }
    }

    async function checkInterviewDesigns(formRevision) {
      const result = await context.app.service('interview-design').find({
        query: {
          $limit: 0,
          'steps.form': formRevision.form.toString(),
          'steps.revision': formRevision.revision
        }
      });
      if (result.total>0) {
        const form = await context.app.service('form').get(formRevision.form);
        throw new FormRevisionRemoveError(`Some interview designs (${result.total}) are associated to the form ${form.name} with revision ${formRevision.revision}`, {
          id: formRevision._id.toString(),
          form: form._id.toString(),
          name: form.name,
          revision: formRevision.revision,
          type: 'interview-design',
          count: result.total
        });
      }
    }

    if (context.id) {
      const formRevision = await context.app.service('form-revision').get(context.id);
      await checkCaseReports(formRevision);
      await checkCaseReportForms(formRevision);
      await checkInterviews(formRevision);
      await checkInterviewDesigns(formRevision);
    } else if (context.params.query) {
      const formRevisionsResult = await context.app.service('form-revision').find(context.params);
      for (let formRevision of formRevisionsResult.data) {
        await checkCaseReports(formRevision);
        await checkCaseReportForms(formRevision);
        await checkInterviews(formRevision);
        await checkInterviewDesigns(formRevision);
      }
    }
    
    return context;
  };
};
