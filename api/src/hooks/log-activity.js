const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return (context) => {
    let message = `${context.path}: ${context.type} - ${context.method}`;
    if (context.type === 'error') {
      message += `: ${context.error.message}`;
    }
    logger.debug(message);
    if (context.error) {
      logger.error(context.error);
    }
    if (logger.isSillyEnabled() && context.data) {
      logger.silly('  data: ' + JSON.stringify(context.data));
    }
    if (logger.isDebugEnabled() && context.params) {
      logger.debug('  query: ' + JSON.stringify(context.params.query));
    }
    if (logger.isSillyEnabled() && context.result) {
      logger.silly('  result: ' + JSON.stringify(context.result));
    }
  };
};