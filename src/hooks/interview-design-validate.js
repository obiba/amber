const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify that study exists
    const studyService = context.app.service('study');
    await studyService.get(context.data.study);
    // verify that form (with revision) exist
    const formRevisionService = context.app.service('form-revision');
    if (context.data.steps) {
      const invalidStep = context.data.steps.find((step) => step.name === 'participant');
      if (invalidStep) {
        throw new BadRequest('Interview design cannot have a step named "participant"');
      }
      if (context.data.steps.map((step) => step.name).filter((value, index, self) => self.indexOf(value) === index).length !== context.data.steps.length) {
        throw new BadRequest('Interview design step names must be unique');
      }
      for (const step of context.data.steps) {
        // verify that form exists
        const q = {
          $limit: 0,
          study: context.data.study,
          form: step.form
        };
        if (step.revision) {
          q.revision = step.revision;
        }
        const res = await formRevisionService.find({ query: q });
        if (res.total === 0) {
          throw new BadRequest('Bad form revision');
        }
      }
    }
    
    return context;
  };
};
