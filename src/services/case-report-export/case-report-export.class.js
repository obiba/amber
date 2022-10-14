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
    const crResult = {
      export: {},
      total: 0,
      found: 0,
      skip: this.parseInteger(params.query['$skip']),
      limit: this.parseInteger(params.query['$limit']), // targetted limit, might be lower than database extraction allows
      audit: {
        entityIds: [],
        caseReportIds: []
      }
    };
    const formRevisions = {};
    const forms = {};

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

    for (const limit of limits) {
      params.query['$limit'] = limit;
      let result = await caseReportService.find(params);
    
      // start process result
      crResult.total = result.total; // total does not changed
      crResult.found = crResult.found + (result.data ? result.data.length : 0);
      if (result.data && result.data.length > 0) {
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
      } else {
        // no more results, then break loop
        break;
      }
      // end process result
      params.query['$skip'] = params.query['$skip'] + limit;
    }

    return crResult;
  }

  parseInteger (value) {
    if (typeof value === 'string') {
      const chars = value.toLowerCase().split('e');
      if (chars.length>1) {
        const op1 = parseFloat(chars[0]);
        const op2 = parseInt(chars[1]);
        if (isNaN(op1) || isNaN(op2))
          return NaN;
        return parseInt(op1 * Math.pow(10, op2));
      } else {
        return parseInt(value);
      }
    }
    return parseInt(value);
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
          rval[item.name] = this.marshallValue(data[item.name]);
        }
      });
    }
    return rval;
  }

  marshallValue (value) {
    if(typeof(value) === 'object') {
      // simplify geojson value to its coordinates, the type of feature will be in the data dictionary
      if (value.type && value.type === 'Feature' && value.geometry && value.geometry.coordinates) {
        return JSON.stringify(value.geometry.coordinates);
      }
      if (Array.isArray(value)) {
        return value.map(val => this.marshallValue(val));
      }
    }
    return value;
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
