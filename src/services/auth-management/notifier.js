const format = require('string-template');
const logger = require('../../logger');

module.exports = function (app) {

  function getLink(type, hash) {
    const url = (process.env.AMBER_STUDIO_URL || app.get('amber_studio_url')) + '/' + type + '?token=' + hash;
    return url;
  }

  function sendEmail(email) {
    return app
      .service('email')
      .create(email)
      .then(function (result) {
        logger.debug('Sent email', result);
      })
      .catch((err) => {
        logger.error('Error sending email', err);
      });
  }
  const FROM_EMAIL = app.get('from_email');

  return {
    service: 'user',
    notifier: function (type, user, data) {
      let email;
      logger.debug('type', type);
      const emailTemplates = app.get('email_templates');
      const subject = emailTemplates[type][user.language] ? emailTemplates[type][user.language].subject : emailTemplates[type].en;
      const html = emailTemplates[type][user.language] ? emailTemplates[type][user.language].html : emailTemplates[type].en;
      const context = {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        language: user.language,
        role: user.role,
        amber_studio_url: (process.env.AMBER_STUDIO_URL || app.get('amber_studio_url'))
      };
      logger.debug('user', user);
      switch (type) {
      case 'notifySignup':
        logger.debug('data', data);
        context.newUserEmail = data.email;
        email = {
          from: FROM_EMAIL,
          to: user.email,
          subject: subject,
          html: format(html, context),
        };
        return sendEmail(email);
      case 'resendVerifySignup':
        //sending the user the verification email
        
        context.tokenLink = getLink('verify', user.verifyToken);
        email = {
          from: FROM_EMAIL,
          to: user.email,
          subject: subject,
          html: format(html, context),
        };
        return sendEmail(email);
      case 'verifySignup':
        // confirming verification
        context.tokenLink = getLink('verify', user.verifyToken);
        email = {
          from: FROM_EMAIL,
          to: user.email,
          subject: subject,
          html: format(html, context),
        };
        return sendEmail(email);
      case 'sendResetPwd':
        logger.debug('user', user);
        context.tokenLink = getLink('reset-password', user.resetToken);
        email = {
          from: FROM_EMAIL,
          to: user.email,
          subject: subject,
          html: format(html, context),
        };
        return sendEmail(email);
      case 'resetPwd':
        context.tokenLink = getLink('reset-password', user.resetToken);
        email = email = {
          from: FROM_EMAIL,
          to: user.email,
          subject: subject,
          html: format(html, context),
        };
        return sendEmail(email);
      case 'passwordChange':
        email = {
          from: FROM_EMAIL,
          to: user.email,
          subject: subject,
          html: format(html, context),
        };
        return sendEmail(email);
      /* case 'identityChange':
        tokenLink = getLink('verify', user.verifyToken);
        logger.debug('user', user);
        email = {
          from: FROM_EMAIL,
          to: [user.verifyChanges.email, user.email],
          subject: 'Verify New Email Address',
          html: `<html><b>${tokenLink}</b></html>`,
        };
        return sendEmail(email); */
      default:
        break;
      }
    },
  };
};
