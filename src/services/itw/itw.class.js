const { BadRequest } = require('@feathersjs/errors');
const { ItwBase } = require('../../utils/itw');

/**
 * Get or create the interview for the requesting participant (either by the
 * the participant itself, or on behalf of an interviewer).
 */
/* eslint-disable no-unused-vars */
exports.Itw = class Itw extends ItwBase {

  async find (params) {
    const { interview } = await this.getOrCreateInterview(params);
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
    const { interview, interviewDesign } = await this.getOrCreateInterview(params);
    const itwService = this.app.service('interview');

    const patched = {};
    if (data.steps) {
      patched.steps = interview.steps;
      for (const step of data.steps) {
        const idx = patched.steps.map(step => step.name).indexOf(step.name);
        if (step.state === null) {
          // remove the step
          if (idx >= 0) {
            patched.steps.splice(idx, 1);
          }
          continue;
        }
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

    if (data.state) {
      // interview state is forced
      patched.state = data.state;
    } else {
      // check step states for setting the interview state
      let states = {};
      if (patched.steps) {
        patched.steps.forEach((step) => states[step.name] = step.state);
      }
      if (interview.steps) {
        interview.steps.forEach((step) => {
          if (!states[step.name]) {
            states[step.name] = step.state;
          }
        });
      }
      // note: does not cover the cases where dependent states are not to be filled-in
      // so it is up to the client that evaluated the step activity to specify the global interview state
      if (Object.values(states).length === 0) {
        patched.state = 'initiated';
      } else {
        patched.state = Object.values(states).length < interviewDesign.steps.length || Object.values(states).includes('in_progress') ? 'in_progress' : 'completed';
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
        campaign: campaign._id,
        interviewDesign: interviewDesign._id,
        study: interviewDesign.study,
        state: 'initiated',
        steps: []
      });
    } else {
      interview = result.data[0];
    }

    return { interview, interviewDesign };
  }

  digestInterview(interview) {
    return {
      _id: interview._id,
      code: interview.code,
      identifier: interview.identifier,
      data: interview.data,
      interviewDesign: interview.interviewDesign, // for consistency with itwd service
      state: interview.state,
      fillingDate: interview.fillingDate,
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
