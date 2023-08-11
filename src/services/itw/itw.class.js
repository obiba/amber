const { BadRequest } = require('@feathersjs/errors');
const { ItwBase } = require('../itwd/itwd.utils');

/**
 * Get or create the interview for the requesting participant (either by the 
 * the participant itself, or on behalf of an interviewer).
 */
/* eslint-disable no-unused-vars */
exports.Itw = class Itw extends ItwBase {

  async find (params) {
    const interview = await this.getOrCreateInterview(params);
    return {
      limit: 1,
      skip: 0,
      total: 1,
      data: [this.digestInterview(interview)]
    };
  }

  async get (id, params) {
    throw new BadRequest('Not implemented');
  }

  async create (data, params) {
    throw new BadRequest('Not implemented');
  }

  async update (id, data, params) {
    return data;
  }

  async patch (id, data, params) {
    const interview = await this.getOrCreateInterview(params);
    const itwService = this.app.service('interview');

    const patched = {};
    if (data.state) {
      patched.state = data.state;
    }
    if (data.steps) {
      patched.steps = interview.steps;
      for (const step of data.steps) {
        const idx = patched.steps.map(step => step.name).indexOf(step.name);
        const type = step.data ? (step.state === 'completed' ? 'complete' : 'pause') : 'init'; 
        if (idx<0) {
          step.actions = [
            {
              type: type,
              user: params.user ? params.user._id : undefined,
              timestamp: new Date()
            }
          ];
          patched.steps.push(step);
        } else {
          const action = {
            type: step.data ? type : 'invalid',
            user: params.user ? params.user._id : undefined,
            timestamp: new Date()
          };
          step.actions = patched.steps[idx].actions;
          step.actions.push(action);
          patched.steps.splice(idx, 1, step);
        }
      }
    }

    params.query = {};
    return this.digestInterview(await itwService.patch(interview._id, patched, params));
  }

  async remove (id, params) {
    throw new BadRequest('Not implemented');
  }

  /**
   * Make security checks, and get or create the interview for the requesting participant.
   * @param {Object} params 
   * @returns 
   */
  async getOrCreateInterview (params) {
    const { participant, campaign, interviewDesign } = await this.extractInterviewInfo(params);

    // try to find the interview
    const itwService = this.app.service('interview');
    let result = await itwService.find({ query: { code: participant.code } });
    let interview;
    if (result.total === 0) {
      // create one
      interview = await itwService.create({
        code: participant.code,
        identifier: participant.identifier,
        participant: participant._id,
        interviewDesign: interviewDesign._id,
        study: interviewDesign.study,
        state: 'in_progress',
        steps: []
      });
    } else {
      interview = result.data[0];
    }

    return interview;
  }

  digestInterview(interview) {
    return {
      _id: interview._id,
      code: interview.code,
      identifier: interview.identifier,
      interviewDesign: interview.interviewDesign, // for consistency with itwd service
      state: interview.state,
      steps: interview.steps.map(step => {
        return {
          name: step.name,
          state: step.state,
          data: step.data
        };
      })
    };
  }
};
