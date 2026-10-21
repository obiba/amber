// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

/**
 * Remove the deleted studies from the scope of the api keys.
 */
// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const ids = [context.result].flat().map(study => study._id);
    const model = await context.app.service('api-key').getModel();
    await model.updateMany({}, { $pull: { studies: { $in: ids } } });
    return context;
  };
};
