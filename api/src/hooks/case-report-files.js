// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { fileIds, getFormSchema, checkFiles, attachFiles, deleteRecordFiles } = require('../utils/files');

/**
 * Before create: check the files referenced by the case report data.
 * After create: attach these files to the case report.
 * After remove: delete the files of the case report(s).
 */
// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const { app, data, params, result } = context;
    if (context.method === 'remove') {
      await deleteRecordFiles(app, 'case-report', result);
    } else if (context.type === 'before') {
      const ids = fileIds(await getFormSchema(app, data.form, data.revision), data.data);
      await checkFiles(app, ids, params.user?._id);
      params.fileIds = ids;
    } else if (params.fileIds) {
      await attachFiles(app, params.fileIds, { service: 'case-report', id: result._id, study: result.study, form: result.form });
    }
    return context;
  };
};
