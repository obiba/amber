// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // activate associated participant when its interview is reopened
    if (context.data.state === 'in_progress') {
      const itw = await context.app.service('interview').get(context.id);
      // check it is an interview reopening
      if (itw.state === 'completed') {
        context.app.service('participant').patch(itw.participant, {
          activated: true
        });
        context.data.steps = itw.steps;
        context.data.steps.forEach(step => {
          step.state = 'in_progress';
          if (step.data) {
            step.data.__page = 0;
          }
          step.actions.push({
            type: 'reopen',
            user: context.params.user._id,
            timestamp: Date.now()
          });
        });
      }
    }
    return context;
  };
};
