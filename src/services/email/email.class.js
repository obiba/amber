const { BadRequest } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.Email = class Email {
  constructor (options) {
    this.options = options || {};
  }

  async find (params) {
    throw new BadRequest('Not implemented');
  }

  async get (id, params) {
    throw new BadRequest('Not implemented');
  }

  async create (data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    return data;
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
