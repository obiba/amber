/* eslint-disable no-unused-vars */
const { BadRequest } = require('@feathersjs/errors');

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
    const crResult = {
      export: {},
      audit: {
        entityIds: [],
        caseReportIds: []
      }
    };
    const formRevisions = {};
    const forms = {};
    if (result.total > 0) {
      for (const cr of result.data) {
        // flatten data
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
          if (formRevisions[key]) {
            formRevisions[key].name = forms[cr.form].name;
          } else {
            // case the form revision was removed, fallback to the current form
            formRevisions[key] = forms[cr.form];
          }
        }
        if (!crResult.export[key]) {
          crResult.export[key] = { data: [], fields: [], formRevision: formRevisions[key] };
        }
        const flattenData = this.flattenByItems(formRevisions[key].schema.items, cr.data);
        const fields = crResult.export[key].fields.concat(Object.keys(flattenData));
        crResult.export[key].fields = fields.filter((item, pos) => fields.indexOf(item) === pos);
        crResult.export[key].data.push(flattenData);
        if (!crResult.audit.entityIds.includes(cr.data._id)) {
          crResult.audit.entityIds.push(cr.data._id);
        }
        crResult.audit.caseReportIds.push(cr._id);
      }
    }
    return crResult;
  }

  flattenByItems (items, data, path) {
    const rval = data ? {
      _id: data._id
    } : {};
    if (data) {
      items.forEach(item => {
        if (item.items) {
          const npath = path ? [...path] : [];
          npath.push(item.name);
          const rval2 = this.flattenByItems(item.items, data[item.name], npath);
          Object.entries(rval2).forEach(([key, value]) => {
            rval[npath.join('.') + '.' + key] = value;
          });
        } else {
          rval[item.name] = data[item.name];
        }
      });
    }
    return rval;
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
