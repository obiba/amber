// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // deactivate associated participant when its interview is completed
    if (context.result.state === 'completed') {
      context.app.service('participant').patch(context.result.participant, {
        activated: false
      });
    }
    return context;
  };
};
