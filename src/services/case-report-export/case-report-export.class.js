/* eslint-disable no-unused-vars */
const { BadRequest } = require('@feathersjs/errors');
const { flatten } = require('flatten-anything');

exports.CaseReportExport = class CaseReportExport {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    const caseReportService = this.app.service('case-report');
    const formRevisionService = this.app.service('form-revision');
    const formService = this.app.service('form');
    const result = await caseReportService.find(params);
    const crResult = {};
    const formRevisions = {};
    const forms = {};
    if (result.total > 0) {
      for (const cr of result.data) {
        const key = `${cr.form}-${cr.revision}`;
        if (!formRevisions[key]) {
          const q = {
            $limit: 1,
            study: cr.study,
            form: cr.form,
            revision: cr.revision
          };
          const revisions = await formRevisionService.find({
            query: q
          });
          formRevisions[key] = revisions.data.pop();
          if (!forms[cr.form]) {
            forms[cr.form] = await formService.get(cr.form);
          }
          formRevisions[key].name = forms[cr.form].name;
        }
        if (!crResult[key]) {
          crResult[key] = { data: [], fields: [], formRevision: formRevisions[key] };
        }
        const flattenData = flatten(cr.data);
        const fields = crResult[key].fields.concat(Object.keys(flattenData));
        crResult[key].fields = fields.filter((item, pos) => fields.indexOf(item) === pos);
        crResult[key].data.push(flattenData);
      }
    }
    return crResult;
  }

  async get (id, params) {
    throw new BadRequest('Not implemented');
  }

  async create (data, params) {
    throw new BadRequest('Not implemented');
  }

  async update (id, data, params) {
    throw new BadRequest('Not implemented');
  }

  async patch (id, data, params) {
    throw new BadRequest('Not implemented');
  }

  async remove (id, params) {
    throw new BadRequest('Not implemented');
  }
};
