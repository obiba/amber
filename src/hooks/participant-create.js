// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify that study exists
    const studyService = context.app.service('study');
    await studyService.get(context.data.study);
    // verify that campaign exists
    const campaignService = context.app.service('campaign');
    await campaignService.get(context.data.campaign);
    // generate a code, unique in all app
    const participantService = context.app.service('participant');
    const generateCode = () => (Math.random() + 1).toString(36).substring(2, 5).toUpperCase();
    let codeTmp = generateCode();
    let unique = false;
    while (!unique) {
      const q = {
        $limit: 0,
        code: codeTmp
      };
      const res = await participantService.find({ query: q });
      if (res.total === 0) {
        unique = true;
      } else {
        codeTmp = generateCode();
      }
    }
    context.data.code = codeTmp;
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
