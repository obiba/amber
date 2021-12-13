const { BadRequest } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.Crfs = class Crfs {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    const formRevisionService = this.app.service('form-revision');
    const result = await this.app.service('case-report-form').find(params);
    
    const data = [];
    for (const crf of result.data) {
      const q = {
        $limit: 1,
        $sort: { revision: -1 },
        study: crf.study,
        form: crf.form
      };
      const frResult = await formRevisionService.find({
        query: q
      });
      if (frResult.total > 0) {
        data.push({
          _id: frResult.data[0]._id,
          schema: frResult.data[0].schema,
          revision: frResult.data[0].revision
        });
      }
    }
    result.data = data;
    return result;
  }

  async get (id, params) {
    return {
      id, text: `A new message with ID: ${id}!`
    };
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
