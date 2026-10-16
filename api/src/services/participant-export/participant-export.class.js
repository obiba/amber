/* eslint-disable no-unused-vars */
const { BadRequest } = require('@feathersjs/errors');

exports.ParticipantExport = class ParticipantExport {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  formatDate (date) {
    if (date) {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    }
    return date;
  }

  async find (params) {
    const res = await this.app.service('participant').find(params);
    return res.data.map(datum => {
      return {
        code: datum.code,
        identifier: datum.identifier,
        validFrom: this.formatDate(datum.validFrom),
        validUntil: this.formatDate(datum.validUntil),
        activated: datum.activated,
        data: datum.data
      };
    });
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
