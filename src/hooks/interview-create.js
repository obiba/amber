// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // Check itw form exists and get associated study
    if (!context.data.interviewDesign) {
      throw new BadRequest('Interview form is missing');
    }
    const itwDesignService = context.app.service('interview-design');
    const itwDesign = await itwDesignService.get(context.data.interviewDesign);
    context.data.study = itwDesign.study;

    // Get participant from its code
    const participantService = context.app.service('participant');
    const participantFound = await participantService.find({
      query: {
        $limit: 1,
        code: context.data.code,
      }
    });
    if (participantFound.total === 0) {
      throw new BadRequest(`Not a valid participant invitation code ${context.data.code}`);
    }
    const participant = participantFound.data[0];
    context.data.participant = participant._id;
    context.data.data = participant.data;

    // Add or reject/replace this interview
    const policy = itwDesign.repeatPolicy ? itwDesign.repeatPolicy : 'multiple';
    if (policy !== 'multiple') {
      const itwService = context.app.service('interview');
      const itwsFound = await itwService.find({
        query: {
          $limit: 1,
          interviewDesign: context.data.interviewDesign,
          participant: context.data.participant
        }
      });
      if (itwsFound.total > 0) {
        if (policy === 'single_reject') {
          throw new BadRequest(`There is already an Interview with ID ${context.data.data._id}`);
        } else {
          await itwService.remove(itwsFound.data[0]._id);
        }
      }
    }

    // Set created by the logged in user
    if (context.params.user) {
      context.data.createdBy = context.params.user._id;  
    }
    return context;
  };
};
