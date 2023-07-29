/* eslint-disable no-unused-vars */
const { BadRequest } = require('@feathersjs/errors');

exports.FormI18nExport = class FormI18nExport {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    throw new BadRequest('Not implemented');
  }

  async get (id, params) {
    const formService = this.app.service('form');
    return formService.get(id);
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
