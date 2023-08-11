const { BadRequest } = require('@feathersjs/errors');
const { ItwBase } = require('./itwd.utils');

/**
 * Get a digest of the interview design that applies to the requesting participant (either by the 
 * the participant itself, or on behalf of an interviewer).
 */
/* eslint-disable no-unused-vars */
exports.Itws = class Itws extends ItwBase {

  async find (params) {
    const { participant, campaign, interviewDesign } = await this.extractInterviewInfo(params);

    // prepare data
    const participantData = {
      _id: participant._id,
      code: participant.code,
      identifier: participant.identifier,
      data: participant.data
    };
    let result = await this.app.service('user').find({ query: { _id: { $in: campaign.investigators } } });
    const investigators = result.data.map(user => {
      return {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        institution: user.institution,
        city: user.city
      };
    });

    const formRevisionService = this.app.service('form-revision');
    const itwdata = {
      _id: interviewDesign._id,
      name: interviewDesign.name,
      label: interviewDesign.label,
      description: interviewDesign.description,
      steps: [],
      i18n: interviewDesign.i18n,
      participant: participantData,
      investigators: investigators
    };
    for (const step of interviewDesign.steps) {
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
          form: frResult.data[0].form,
          revision: frResult.data[0].revision
        });
      }
    }
    
    return {
      limit: 1,
      skip: 0,
      total: 1,
      data: [itwdata]
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
