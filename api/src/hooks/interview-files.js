// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { checkStepsFiles, syncStepsFiles, deleteRecordFiles } = require('../utils/files');

/**
 * Before patch: check the files referenced by the steps data.
 * After patch: attach these files to the interview step, delete the ones no longer referenced.
 * After remove: delete the files of the interview(s).
 */
// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const { app, data, params, result } = context;
    if (context.method === 'remove') {
      await deleteRecordFiles(app, 'interview', result);
    } else if (context.type === 'before') {
      if (data.steps && context.id !== null && context.id !== undefined) {
        params.stepsFileIds = await checkStepsFiles(app, { _id: context.id }, data.steps, params.user?._id);
      }
    } else if (params.stepsFileIds) {
      await syncStepsFiles(app, result, params.stepsFileIds);
    }
    return context;
  };
};
