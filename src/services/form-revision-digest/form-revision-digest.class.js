const { BadRequest } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.FormRevisionDigest = class FormRevisionDigest {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    const result = await this.app.service('form-revision').find(params);
    result.data = result.data.map(rev => {
      delete rev.schema;
      return rev;
    });
    return result;
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
