const { BadRequest } = require('@feathersjs/errors');
const { ItwBase } = require('../../utils/itw');

/**
 * Get a digest of the interview design that applies to the requesting participant (either by the 
 * the participant itself, or on behalf of an interviewer).
 */
/* eslint-disable no-unused-vars */
exports.Itwd = class Itwd extends ItwBase {

  async find (params) {
    const { participant, campaign, interviewDesign } = await this.extractInterviewInfo(params);

    // prepare data
    const participantData = {
      _id: participant._id,
      code: participant.code,
      identifier: participant.identifier,
      data: participant.data
    };
    let result = await this.app.service('user').find({ query: { _id: { $in: campaign.supporters } } });
    const supporters = result.data.map(user => {
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
      interviewer_instructions: interviewDesign.interviewer_instructions,
      participant_instructions: interviewDesign.participant_instructions,
      steps: [],
      i18n: interviewDesign.i18n,
      participant: participantData,
      supporters: supporters,
      completionUrl: campaign.completionUrl,
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
          time_estimate: step.time_estimate,
          time_estimate_max: step.time_estimate_max,
          condition: step.condition,
          disable: step.disable,
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
