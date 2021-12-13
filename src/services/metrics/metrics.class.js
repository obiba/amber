const { BadRequest } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.Metrics = class Metrics {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    const p = {
      query: {
        $limit: 0
      },
    };
    const counts = await Promise.all([
      this.app.service('user').find(p),
      this.app.service('group').find(p),
      this.app.service('study').find(p),
      this.app.service('form').find(p),
      this.app.service('case-report-form').find(p)
    ]);
    return {
      counts: {
        users: counts[0].total,
        groups: counts[1].total,
        studies: counts[2].total,
        forms: counts[3].total,
        case_report_forms: counts[4].total
      }
    };
  }

  async get (id, params) {
    throw new BadRequest('Not implemented');
    // return {};
  }

  async create (data, params) {
    throw new BadRequest('Not implemented');
    // if (Array.isArray(data)) {
    //   return Promise.all(data.map(current => this.create(current, params)));
    // }
    // return data;
  }

  async update (id, data, params) {
    throw new BadRequest('Not implemented');
    // return data;
  }

  async patch (id, data, params) {
    throw new BadRequest('Not implemented');
    // return data;
  }

  async remove (id, params) {
    throw new BadRequest('Not implemented');
    // return { id };
  }
};
