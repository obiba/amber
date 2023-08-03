// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    async function decorateData (pdata) {
      // verify that campaign exists
      const campaign = await context.app.service('campaign').get(pdata.campaign);
      const itwDesign = await context.app.service('interview-design').get(campaign.interviewDesign);
      pdata.study = itwDesign.study;
      // generate a code, unique in all app
      const participantService = context.app.service('participant');
      const generateCode = () => (Math.random() + 1).toString(36).substring(2, 8).toUpperCase();
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
      pdata.code = codeTmp;
      // Set created by the logged in user
      pdata.createdBy = context.params.user._id;
      return pdata;
    }
    if (Array.isArray(context.data)) {
      const dataPromises = context.data.map(pdata => decorateData(pdata));
      return Promise.all(dataPromises).then(data => {
        context.data = data;
        return context;
      });
    } else {
      context.data = await decorateData(context.data);
      return context;
    }
  };
};
