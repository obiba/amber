// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const { isParticipantValid } = require('../utils/participant-validity');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    async function isParticipantIdValid(participantId) {
      try {
        const participant = await context.app.service('participant').get(participantId);
        return isParticipantValid(participant);
      } catch (error) {
        return false;
      }
    }
    if (context.result.data) {
      if (Array.isArray(context.result.data)) {
        context.result.data = await Promise.all(context.result.data.map(async interview => {
          const participantId = interview.participant;
          const isValid = await isParticipantIdValid(participantId);
          return { ...interview, participantValid: isValid };
        }));
      } else {
        const participantId = context.result.data.participant;
        const isValid = await isParticipantIdValid(participantId);
        context.result.data = { ...context.result.data, participantValid: isValid };
      }
    }
    return context;
  };
};
