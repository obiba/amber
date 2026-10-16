// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const { FeathersError } = require('@feathersjs/errors');

class FormRemoveError extends FeathersError {
  constructor(message, data) {
    super(message, 'FormRemoveError', 400, 'bad-request', data);
  }
}

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    async function checkCaseReports(form) {
      const result = await context.app.service('case-report').find({
        query: {
          $limit: 0,
          form: form._id.toString()
        }
      });
      if (result.total>0) {
        throw new FormRemoveError(`Some case reports (${result.total}) are associated to the form ${form.name}`, {
          id: form._id.toString(),
          name: form.name,
          type: 'case-report',
          count: result.total
        });
      }
    }

    async function checkCaseReportForms(form) {
      const result = await context.app.service('case-report-form').find({
        query: {
          $limit: 0,
          form: form._id.toString()
        }
      });
      if (result.total>0) {
        throw new FormRemoveError(`Some case report forms (${result.total}) are associated to the form ${form.name}`, {
          id: form._id.toString(),
          name: form.name,
          type: 'case-report-form',
          count: result.total
        });
      }
    }

    async function checkInterviews(form) {
      const result = await context.app.service('case-report').find({
        query: {
          $limit: 0,
          'steps.form': form._id.toString()
        }
      });
      if (result.total>0) {
        throw new FormRemoveError(`Some interviews (${result.total}) are associated to the form ${form.name}`, {
          id: form._id.toString(),
          name: form.name,
          type: 'interview',
          count: result.total
        });
      }
    }

    async function checkInterviewDesigns(form) {
      const result = await context.app.service('interview-design').find({
        query: {
          $limit: 0,
          'steps.form': form._id.toString()
        }
      });
      if (result.total>0) {
        throw new FormRemoveError(`Some interview designs (${result.total}) are associated to the form ${form.name}`, {
          id: form._id.toString(),
          name: form.name,
          type: 'interview-design',
          count: result.total
        });
      }
    }

    if (context.id) {
      const form = await context.app.service('form').get(context.id);
      await checkCaseReports(form);
      await checkCaseReportForms(form);
      await checkInterviews(form);
      await checkInterviewDesigns(form);
    } else if (context.params.query) {
      const formsResult = await context.app.service('form').find(context.params);
      for (let form of formsResult.data) {
        await checkCaseReports(form);
        await checkCaseReportForms(form);
        await checkInterviews(form);
        await checkInterviewDesigns(form);
      }
    }

    return context;
  };
};
