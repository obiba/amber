// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const studyService = context.app.service('study');

    // remove forms associated to the removed study
    const removeFormFromStudy = (form) => {
      studyService.get(form.study)
        .then(study => {
          logger.debug('Removing form ' + form._id + ' from study: ' + study._id);
          study.forms = study.forms.filter(fid => fid.toString() !== form._id.toString());
          studyService.update(study._id, study);    
        })
        .catch(err => console.log(err));
    };

    if (Array.isArray(context.result)) {
      context.result.forEach(form => {
        removeFormFromStudy(form);
      });
    } else {
      removeFormFromStudy(context.result);
    }

    return context;
  };
};
