const { BadRequest } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.Subjects = class Subjects {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    const subjects = [];
    const groups = await this.app.service('group').find(params);
    if (params.query && params.query.name) {
      params.query.email = params.query.name;
      delete params.query.name;
    }
    const users = await this.app.service('user').find(params);
    
    users.data.forEach(user => {
      subjects.push({
        type: 'user',
        id: user._id,
        name: user.email
      });
    });
    groups.data.forEach(group => {
      subjects.push({
        type: 'group',
        id: group._id,
        name: group.name
      });
    });
    return subjects;
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
