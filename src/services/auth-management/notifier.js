const format = require('string-template');
const fs = require('fs');
const logger = require('../../logger');

module.exports = function (app) {

  function getLink(type, user, hash) {
    let baseUrl = (process.env.AMBER_STUDIO_URL || app.get('amber_studio_url'));
    // either registered itself from collect app or user was added as an interviewer/guest
    if (user.clientId === 'amber_collect' || (!user.clientId && ['interviewer', 'guest'].includes(user.role))) {
      baseUrl = (process.env.AMBER_COLLECT_URL || app.get('amber_collect_url'));
    }

    const url = baseUrl + '/' + type + '?token=' + hash;
    return url;
  }

  function sendEmail(email) {
    email.headers = {
      'x-amber': `${process.env.APP_NAME ? process.env.APP_NAME : '?'}`
    };
    if (!Array.isArray(email.to)) {
      email.to = [ email.to ];
    }
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
  const FROM_EMAIL = process.env.FROM_EMAIL ? process.env.FROM_EMAIL : app.get('from_email');

  return {
    service: 'user',
    notifier: function (type, user, data) {
      logger.debug('type', type);
      const emailTemplates = app.get('email_templates');
      if (emailTemplates[type]) {
        const subject = emailTemplates[type][user.language] ? emailTemplates[type][user.language].subject : emailTemplates[type].en.subject;
        const file = emailTemplates[type][user.language] ? emailTemplates[type][user.language].file : emailTemplates[type].en.file;
        let html;
        // read template from file if it exists
        if (file) {
          try {
            html = fs.readFileSync(file, 'utf8');
          } catch (err) {
            logger.error(`Unable to read email template: ${file}`, err);
            html = undefined;
          }
        }
        // fallback to html string from config
        if (!html) {
          html = emailTemplates[type][user.language] ? emailTemplates[type][user.language].html : emailTemplates[type].en.html;
        }
  
        const context = {
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          language: user.language,
          role: user.role,
          app_name: (process.env.APP_NAME || 'Amber'),
          amber_studio_url: (process.env.AMBER_STUDIO_URL || app.get('amber_studio_url')),
          amber_collect_url: (process.env.AMBER_COLLECT_URL || app.get('amber_collect_url'))
        };

        let email;
        switch (type) {
        case 'notifySignup':
          // notifying user about a self-registration
          logger.debug('data', data);
          context.newUserEmail = data.email;
          logger.debug('Email context', context);
          email = {
            from: FROM_EMAIL,
            to: user.email,
            subject: format(subject, context),
            html: format(html, context),
          };
          return sendEmail(email);
        case 'resendVerifySignup':
          //sending the user the verification email
          context.tokenLink = getLink('verify', user, user.verifyToken);
          logger.debug('Email context', context);
          email = {
            from: FROM_EMAIL,
            to: user.email,
            subject: format(subject, context),
            html: format(html, context),
          };
          return sendEmail(email);
        case 'verifySignup':
          // confirming verification
          logger.debug('Email context', context);
          email = {
            from: FROM_EMAIL,
            to: user.email,
            subject: format(subject, context),
            html: format(html, context),
          };
          return sendEmail(email);
        case 'sendResetPwd':
          logger.debug('user', user);
          context.tokenLink = getLink('reset-password', user, user.resetToken);
          logger.debug('Email context', context);
          email = {
            from: FROM_EMAIL,
            to: user.email,
            subject: format(subject, context),
            html: format(html, context),
          };
          return sendEmail(email);
        case 'resetPwd':
          logger.debug('Email context', context);
          email = email = {
            from: FROM_EMAIL,
            to: user.email,
            subject: format(subject, context),
            html: format(html, context),
          };
          return sendEmail(email);
        case 'passwordChange':
          logger.debug('Email context', context);
          email = {
            from: FROM_EMAIL,
            to: user.email,
            subject: format(subject, context),
            html: format(html, context),
          };
          return sendEmail(email);
        default:
          break;
        }
      } else {
        logger.warn(`Email template is not defined for type: ${type}`);
      }
    },
  };
};
