// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // Get IFS
    if (context.data.ifsId) {
      const ifsService = context.app.service('interview-forms');
      const ifs = await ifsService.get(context.data.ifsId);
      context.data.interviewForms = context.data.ifsId;
      context.data.study = ifs.study;

      const participantService = context.app.service('participant');
      const found = await participantService.find({
        query: {
          $limit: 1,
          code: context.data.code,
        }
      });
      if (found.total === 0) {
        throw new BadRequest(`Not a valid participant invitation code ${context.data.code}`);
      }
      const participant = found.data[0];
      context.data.participant = participant._id;
      delete context.data.code; 

      const policy = ifs.repeatPolicy ? ifs.repeatPolicy : 'multiple';
      if (policy !== 'multiple') {
        const itwService = context.app.service('interview');
        const itws = await itwService.find({
          query: {
            $limit: 1,
            interviewForms: context.data.interviewForms,
            participant: context.data.participant
          }
        });
        if (itws.total > 0) {
          if (policy === 'single_reject') {
            throw new BadRequest(`There is already an Interview with ID ${context.data.data._id}`);
          } else {
            await itwService.remove(itws.data[0]._id);
          }
        }
      }
    } else {
      throw new BadRequest('Interview forms is missing');
    }
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
