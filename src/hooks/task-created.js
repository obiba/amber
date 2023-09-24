// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
// eslint-disable-next-line no-unused-vars
const { ParticipantsTasksHandler } = require('../services/participant/participants-tasks-handler.class');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const task = context.result;
    // make sure there is only one task of same type that is in progress
    const result = await context.app.service('task').find({
      query: {
        $limit: 1,
        type: task.type,
        state: 'in_progress',
        _id: { $ne: task._id } // do not find itself!
      }
    });
    if (result.total > 0) {
      context.app.service('task').patch(task._id, {
        error: `Another "${task.type}" task is in progress`,
        state: 'aborted'
      });
    } else if (task.type.startsWith('participants-')) {
      const handler = new ParticipantsTasksHandler(context.app);
      handler.process(task);
    } else {
      context.app.service('task').patch(task._id, {
        error: `No handler for task with type "${task.type}"`,
        state: 'aborted'
      });
    }
    
    return context;
  };
};
