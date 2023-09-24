const { BadRequest } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.Metrics = class Metrics {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    const p = {
      query: {
        $limit: 0
      },
    };
    const agg = [
      /*{
        $match: {
          createdAt: {
            $gte: new Date('2022-01-01'),
            $lt: new Date('2022-04-01')
          }
        }
      },*/
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
    ];
    const counts = await Promise.all([
      this.app.service('user').find(p),
      this.app.service('group').find(p),
      this.app.service('study').find(p),
      this.app.service('form').find(p),
      this.app.service('case-report-form').find(p),
      this.app.service('case-report').find(p),
      this.app.service('case-report').Model.aggregate(agg),
      this.app.service('interview-design').find(p),
      this.app.service('interview').find(p),
      this.app.service('interview').Model.aggregate(agg),
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
