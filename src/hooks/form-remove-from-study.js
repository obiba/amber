// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const studyService = context.app.service('study');
    const study = await studyService.get(context.result.study);
    logger.debug('Removing form ' + context.result._id + ' from study: ' + study._id);
    study.forms = study.forms.filter(fid => fid.toString() !== context.result._id.toString());
    studyService.update(study._id, study);
    return context;
  };
};
