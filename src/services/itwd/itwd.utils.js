const { BadRequest, Forbidden } = require('@feathersjs/errors');

class ItwBase {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async extractInterviewInfo (params) {
    // check if user is an authorized interviewer
    if (params.user && !['interviewer', 'manager', 'administrator'].includes(params.user.role)) {
      throw new Forbidden('You are not an interviewer');
    }
    // resolve participant
    let participant = params.participant;
    if (!participant) {
      if (params.query.code) {
        // get participant from the code in the query
        const res = await this.app.service('participant').find({ query: { code: params.query.code } });
        if (res.total === 0) {
          throw new BadRequest('Participant not found');
        }
        participant = res.data[0];
        const now = new Date().getTime();
        if (!participant.activated 
          || (participant.validFrom && now < participant.validFrom.getTime()) 
          || (participant.validUntil && now > participant.validUntil.getTime())) {
          throw new BadRequest('Not a valid participant code');
        }
      } else  {
        throw new BadRequest('Participant code is missing');
      }
    } // else participant auth itself, so it is valid
    
    // get associated campaign's investigators
    let result = await this.app.service('campaign').find({ query: { _id: participant.campaign } });
    const campaign = result.data[0];
    // an interviewer must be one of the investigators
    if (params.user) {
      if (params.user.role === 'interviewer' && !campaign.investigators.map(id => id.toString()).includes(params.user._id.toString())) {
        throw new Forbidden('Your not an investigator');
      }
    }

    // request is for a participant, then list only its associated interview design
    params.query._id = participant.interviewDesign;
    params.query.state = 'active';
    delete params.query.code;
    result = await this.app.service('interview-design').find(params);
    if (result.total === 0) {
      throw new BadRequest('Interview design is not active');
    }
    const interviewDesign = result.data[0];

    return { participant, campaign, interviewDesign };
  }
}

module.exports = { ItwBase };