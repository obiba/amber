const logger = require('../../logger');
const { MailBuilder } = require('../../utils/mail');

module.exports = function (app) {

  function getLink(type, user, hash) {
    let baseUrl = (process.env.AMBER_STUDIO_URL || app.get('amber_studio_url'));
    // or registered itself from another app
    if (user.clientId === 'amber_collect') {
      baseUrl = (process.env.AMBER_COLLECT_URL || app.get('amber_collect_url'));
    }
    if (user.clientId === 'amber_visit') {
      baseUrl = (process.env.AMBER_VISIT_URL || app.get('amber_visit_url'));
    }

    const url = baseUrl + '/' + type + '?token=' + hash;
    return url;
  }

  return {
    service: 'user',
    notifier: function (type, user, data) {
      const builder = new MailBuilder(app);
      switch (type) {
      case 'notifySignup': // notifying user about a self-registration
        logger.debug('data', data);
        return builder.sendEmail(type, user, { newUserEmail: data.email });
      case 'resendVerifySignup': //sending the user the verification email link
        return builder.sendEmail(type, user, { tokenLink: getLink('verify', user, user.verifyToken) });
      case 'sendResetPwd': // sending the user the reset password link
        return builder.sendEmail(type, user, { tokenLink: getLink('reset-password', user, user.resetToken) });
      case 'verifySignup': // confirming verification
      case 'resetPwd':
      case 'passwordChange':
        return builder.sendEmail(type, user);
      default:
        logger.warn(`Unknown user email type: ${type}`);
        break;
      }
    },
  };
};
