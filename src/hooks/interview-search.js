// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    const query = context.params.query;
    if (query) {
      const query = context.params.query;
      const newQuery = {};
      if (query.participantValid !== undefined) {
        // add participant validity criteria
        if (query.participantValid !== undefined) {
          const pQuery = {
            $limit: context.app.get('paginate').max,
            valid: query.participantValid === true || query.participantValid === 'true',
          };
          if (query.campaign) {
            pQuery.campaign = query.campaign;
          }
          if (query.interviewDesign) {
            pQuery.interviewDesign = query.interviewDesign;
          }
          if (query.study) {
            pQuery.study = query.study;
          }
          const participants = await context.app.service('participant').find(
            {
              query: pQuery,
            });
          if (participants.data) {
            const participantIds = participants.data.map(participant => participant._id);
            newQuery.participant = { $in: participantIds };
          }
        }
        // remove this criteria from the query
        delete query.participantValid;
      }
      context.params.query =  { ...query, ...newQuery };
    }

    return context;
  };
};
