const { BadRequest } = require('@feathersjs/errors');
const { FormDataExport } = require('../../utils/form-export');

/* eslint-disable no-unused-vars */
exports.InterviewExport = class InterviewExport extends FormDataExport {
  constructor (options, app) {
    super(options, app);
    this.interviewDesigns = {};
  }

  async find (params) {
    const itwService = this.app.service('interview');
    const itwResult = {
      export: {},
      total: 0,
      found: 0,
      skip: this.parseInteger(params.query['$skip']),
      limit: this.parseInteger(params.query['$limit']), // targetted limit, might be lower than database extraction allows
    };

    // init the params (needed to support exponent notation like 1e+06)
    params.query['$skip'] = itwResult.skip;
    params.query['$limit'] = itwResult.limit;

    // split the range of search by smaller steps if needed
    const LIMIT_MAX = 500;
    const limits = [];
    if (itwResult.limit > LIMIT_MAX) {
      const ratio = itwResult.limit/LIMIT_MAX;
      itwResult.limit = 0;
      for (let i = 0; i < Math.floor(ratio); i++) {
        limits.push(LIMIT_MAX);
        itwResult.limit = itwResult.limit + LIMIT_MAX;
      }
      const remains = Math.round(LIMIT_MAX * (ratio - Math.floor(ratio)));
      if (remains > 0) {
        limits.push(remains);
        itwResult.limit = itwResult.limit + remains;
      }
    } else {
      limits.push(itwResult.limit);
    }

    const exportData = this.initExport();
    for (const limit of limits) {
      params.query['$limit'] = limit;
      let result = await itwService.find(params);

      // start process result
      itwResult.total = result.total; // total does not changed
      itwResult.found = itwResult.found + (result.data ? result.data.length : 0);
      if (result.data && result.data.length > 0) {
        for (const itw of result.data) {
          const interviewDesign = await this.getInterviewDesign(itw.interviewDesign);
          
          for (const step of itw.steps) {
            // group by form id + form revision
            const key = `${interviewDesign.name}-${step.name}-${step.form}-${step.revision}`;

            const stepData = {
              id: itw.identifier ? itw.identifier : itw.code,
              _code: itw.code,
              ...step.data,
            };

            await this.appendExportData(
              exportData,
              key,
              step.form,
              step.revision,
              stepData,
              { multiple: false }
            );

            exportData.exportResults[key].step = step;
            exportData.exportResults[key].interviewDesign = interviewDesign;
          }
        }
      } else {
        // no more results, then break loop
        break;
      }
      // end process result
      params.query['$skip'] = params.query['$skip'] + limit;
    }

    itwResult.export = exportData.exportResults;
    return itwResult;
  }

  async getInterviewDesign (id) {
    if (!this.interviewDesigns[id]) {
      const itwdService = this.app.service('interview-design');
      this.interviewDesigns[id] = await itwdService.get(id);
    }
    return this.interviewDesigns[id];
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
