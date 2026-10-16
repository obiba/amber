// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const { isParticipantValid } = require('../utils/participant-validity');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.result.data) {
      if (Array.isArray(context.result.data)) {
        context.result.data = await Promise.all(context.result.data.map(async participant => {
          const isValid = await isParticipantValid(participant);
          return { ...participant, valid: isValid };
        }));
      } else {
        const participant = context.result.data;
        const isValid = await isParticipantValid(participant);
        context.result.data = { ...context.result.data, valid: isValid };
      }
    }
    return context;
  };
};
