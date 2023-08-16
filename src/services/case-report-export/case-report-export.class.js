/* eslint-disable no-unused-vars */
const { BadRequest } = require('@feathersjs/errors');
const { FormDataExport } = require('../../utils/form-export');
exports.CaseReportExport = class CaseReportExport extends FormDataExport {
  constructor (options, app) {
    super(options, app);
    this.caseReportForms = {};
  }

  async find (params) {
    const caseReportService = this.app.service('case-report');
    const crResult = {
      export: {},
      total: 0,
      found: 0,
      skip: this.parseInteger(params.query['$skip']),
      limit: this.parseInteger(params.query['$limit']), // targetted limit, might be lower than database extraction allows
    };
    
    // init the params (needed to support exponent notation like 1e+06)
    params.query['$skip'] = crResult.skip;
    params.query['$limit'] = crResult.limit;

    // split the range of search by smaller steps if needed
    const LIMIT_MAX = 500;
    const limits = [];
    if (crResult.limit > LIMIT_MAX) {
      const ratio = crResult.limit/LIMIT_MAX;
      crResult.limit = 0;
      for (let i = 0; i < Math.floor(ratio); i++) {
        limits.push(LIMIT_MAX);
        crResult.limit = crResult.limit + LIMIT_MAX;
      }
      const remains = Math.round(LIMIT_MAX * (ratio - Math.floor(ratio)));
      if (remains > 0) {
        limits.push(remains);
        crResult.limit = crResult.limit + remains;
      }
    } else {
      limits.push(crResult.limit);
    }

    const exportData = this.initExport();
    for (const limit of limits) {
      params.query['$limit'] = limit;
      let result = await caseReportService.find(params);
    
      // start process result
      crResult.total = result.total; // total does not changed
      crResult.found = crResult.found + (result.data ? result.data.length : 0);
      if (result.data && result.data.length > 0) {
        for (const cr of result.data) {
          // group by crf id + form revision
          const key = `${cr.caseReportForm ? cr.caseReportForm : cr.form}-${cr.revision}`;
          
          const caseReportForm = await this.getCaseReportForm(cr.caseReportForm);

          await this.appendExportData(
            exportData,
            key,
            cr.form,
            cr.revision,
            cr.data,
            {
              multiple: caseReportForm.repeatPolicy === 'multiple',
              entityType: 'CaseReport'
            },
            cr._id.toString()
          );

          exportData.exportResults[key].caseReportForm = caseReportForm;
        }
      } else {
        // no more results, then break loop
        break;
      }
      // end process result
      params.query['$skip'] = params.query['$skip'] + limit;
    }

    crResult.export = exportData.exportResults;
    return crResult;
  }

  async getCaseReportForm (id) {
    if (!this.caseReportForms[id]) {
      const caseReportFormService = this.app.service('case-report-form');
      this.caseReportForms[id] = await caseReportFormService.get(id);
    }
    return this.caseReportForms[id];
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
