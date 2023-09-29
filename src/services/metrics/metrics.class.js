const { BadRequest } = require('@feathersjs/errors');
const { ObjectId } = require('mongoose').Types;

/* eslint-disable no-unused-vars */
exports.Metrics = class Metrics {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  makeCountQuery (params, entity) {
    const p = {
      query: {
        $limit: 0
      },
    };
    if (params.query && params.query[entity]) {
      p.query = {
        ...params.query[entity],
        $limit: 0
      };
    }
    return p;
  }

  makeAggregationQuery (params, entity) {
    const agg = [];
    if (params.query && params.query[entity]) {
      agg.push({
        $match: this.toMongoQuery(params.query[entity])
      });
    }
    agg.push(
      {
        $group: {
          _id: {
            year: {
              $year: '$createdAt'
            },
            month: {
              $month: '$createdAt'
            },
            day: {
              $dayOfMonth: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    );
    return agg;
  }

  toMongoQuery (query) {
    ['study', 'form', 'caseReportForm', 'interviewDesign', 'campaign'].forEach(entity => {
      if (query[entity]) {
        query[entity] = ObjectId(query[entity]);
      }
    });
    return query;
  }

  async find (params) {
    const counts = await Promise.all([
      this.app.service('user').find(this.makeCountQuery(params, 'user')),
      this.app.service('group').find(this.makeCountQuery(params, 'group')),
      this.app.service('study').find(this.makeCountQuery(params, 'study')),
      this.app.service('form').find(this.makeCountQuery(params, 'form')),
      this.app.service('case-report-form').find(this.makeCountQuery(params, 'case-report-form')),
      this.app.service('case-report').find(this.makeCountQuery(params, 'case-report')),
      this.app.service('case-report').Model.aggregate(this.makeAggregationQuery(params, 'case-report')),
      this.app.service('interview-design').find(this.makeCountQuery(params, 'interview-design')),
      this.app.service('interview').find(this.makeCountQuery(params, 'interview')),
      this.app.service('interview').Model.aggregate(this.makeAggregationQuery(params, 'interview')),
    ]);
    return {
      counts: {
        users: counts[0].total,
        groups: counts[1].total,
        studies: counts[2].total,
        forms: counts[3].total,
        case_report_forms: counts[4].total,
        case_reports: counts[5].total,
        case_reports_agg: counts[6],
        interview_designs: counts[7].total,
        interviews: counts[8].total,
        interviews_agg: counts[9],
      }
    };
  }

  async get (id, params) {
    if (id === 'case-report') {
      return {
        counts: {
          case_reports: await this.app.service('case-report').find(this.makeCountQuery(params, 'case-report')),
          case_reports_agg: await this.app.service('case-report').Model.aggregate(this.makeAggregationQuery(params, 'case-report')),
        }
      };
    }
    if (id === 'interview') {
      return {
        counts: {
          interviews: await this.app.service('interview').find(this.makeCountQuery(params, 'interview')),
          interviews_agg: await this.app.service('interview').Model.aggregate(this.makeAggregationQuery(params, 'interview')),
        }
      };
    }
    return {
      counts: {
        [id]: await this.app.service(id).find(this.makeCountQuery(params, id))
      }
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
