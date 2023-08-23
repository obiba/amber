const format = require('string-template');
const fs = require('fs');
const logger = require('../logger');

exports.MailBuilder = class MailBuilder {
  constructor(app) {
    this.app = app;
  }

  /**
   * Make an email from string or file template of the provided type.
   * @param {string} type The type of template
   * @param {Object} user The recipient
   * @param {Object} context The data that can be injected in the email subject/body
   * @returns 
   */
  buildEmail(type, user, context) {
    logger.debug('type', type);
    const emailTemplates = this.app.get('email_templates');
    if (emailTemplates[type]) {
      const FROM_EMAIL = process.env.FROM_EMAIL ? process.env.FROM_EMAIL : this.app.get('from_email');
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

      const ctx = {
        ...context,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        language: user.language,
        role: user.role,
        app_name: (process.env.APP_NAME || 'Amber'),
        amber_studio_url: (process.env.AMBER_STUDIO_URL || this.app.get('amber_studio_url')),
        amber_collect_url: (process.env.AMBER_COLLECT_URL || this.app.get('amber_collect_url')),
        amber_visit_url: (process.env.AMBER_VISIT_URL || this.app.get('amber_visit_url'))
      };

      logger.debug('Email context', ctx);

      return {
        from: FROM_EMAIL,
        subject: format(subject, ctx),
        html: format(html, ctx),
        attachments: ctx.attachments || []
      };
    } else {
      logger.error(`Email template is not defined for type: ${type}`);
    }
  }

  sendEmail(type, user, context, dryRun) {
    const email = this.buildEmail(type, user, context);
    if (!email) return;
    
    email.to = [ user.email ];
    email.headers = {
      'x-amber': `${process.env.APP_NAME ? process.env.APP_NAME : '?'}`
    };
    if (dryRun) {
      logger.debug(JSON.stringify(email));
    } else {
      this.app
        .service('email')
        .create(email)
        .then(function (result) {
          logger.debug('Sent email', result);
        })
        .catch((err) => {
          logger.error('Error sending email', err);
        });
    }
    
  }
};