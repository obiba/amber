/* eslint-disable no-unused-vars */
exports.Itws = class Itws {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    const formRevisionService = this.app.service('form-revision');
    params.query.state = 'active';
    const result = await this.app.service('interview-design').find(params);
    
    const data = [];
    for (const itwd of result.data) {
      const itwdata = {
        _id: itwd._id,
        name: itwd.name,
        description: itwd.description,
        steps: []
      };
      for (const step of itwd.steps) {
        const q = {
          $limit: 1,
          $sort: { revision: -1 },
          form: step.form
        };
        if (step.revision) {
          q.revision = step.revision;
        }
        const frResult = await formRevisionService.find({
          query: q
        });
        if (frResult.total > 0) {
          itwdata.steps.push({
            _id: step._id,
            name: step.name,
            label: step.label,
            description: step.description,
            schema: frResult.data[0].schema,
            revision: frResult.data[0].revision
          });
        }
      }
      data.push(itwdata);
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
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    return data;
  }

  async update (id, data, params) {
    return data;
  }

  async patch (id, data, params) {
    return data;
  }

  async remove (id, params) {
    return { id };
  }
};
