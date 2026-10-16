/* eslint-disable no-unused-vars */
const { BadRequest } = require('@feathersjs/errors');

exports.InterviewDesignI18nExport = class InterviewDesign {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    throw new BadRequest('Not implemented');
  }

  async get (id, params) {
    const itwdService = this.app.service('interview-design');
    return itwdService.get(id);
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
