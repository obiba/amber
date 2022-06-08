const { BadRequest } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.Account = class Account {
  constructor(options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find(params) {
    throw new BadRequest('Not implemented');
  }

  async get(id, params) {
    throw new BadRequest('Not implemented');
  }

  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)));
    }

    return data;
  }

  async update(id, data, params) {
    return data;
  }

  async patch(id, data, params) {
    let user = await this.app.service('user').find({
      query: {
        email: data.email,
      },
    });
    await this.app.service('user').patch(user.id, user);
    return data;
  }

  async remove(id, params) {
    throw new BadRequest('Not implemented');
  }
};
