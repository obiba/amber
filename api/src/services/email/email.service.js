// Initializes the `email` service on path `/email`
const { EmailService } = require('./email.class');
const hooks = require('./email.hooks');
const BrevoTransport = require('nodemailer-brevo-transport');
const logger = require('../../logger');

module.exports = function (app) {
  // Initialize our service with any options it requires
  let transportConfig;
  if (process.env.GMAIL) {
    transportConfig = {
      service: 'gmail',
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASSWORD
      }
    };
  } else if (process.env.SENDINBLUE_API_KEY || process.env.BREVO_API_KEY) {
    transportConfig = new BrevoTransport({
      apiKey: process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY
    });
  } else {
    const smtpOpts = app.get('smtp') || {};
    transportConfig = {
      host: process.env.SMTP_HOST || smtpOpts.host,
      name: process.env.SMTP_NAME || smtpOpts.name,
      secure: process.env.SMTP_SECURE !== undefined ? (process.env.SMTP_SECURE === true || process.env.SMTP_SECURE === 'true') : smtpOpts.secure,
      requireTLS: process.env.SMTP_REQUIRE_TLS !== undefined ? (process.env.SMTP_REQUIRE_TLS === true || process.env.SMTP_REQUIRE_TLS === 'true') : smtpOpts.require_tls,
      logger: process.env.SMTP_LOGGER !== undefined ? (process.env.SMTP_LOGGER === true || process.env.SMTP_LOGGER === 'true') : smtpOpts.logger,
      debug: process.env.SMTP_DEBUG !== undefined ? (process.env.SMTP_DEBUG === true || process.env.SMTP_DEBUG === 'true') : smtpOpts.debug,
    };
    if (process.env.SMTP_PORT || smtpOpts.port) {
      transportConfig.port = parseInt(process.env.SMTP_PORT || smtpOpts.port, 10);
    }
    if (process.env.SMTP_USER || smtpOpts.user) {
      transportConfig.auth = {
        user: process.env.SMTP_USER || smtpOpts.user,
        pass: process.env.SMTP_PASSWORD || smtpOpts.pw,
      };
    }
    logger.debug('SMTP Config:', transportConfig);
  }

  app.use('/email', new EmailService(transportConfig));

  // Get our initialized service so that we can register hooks
  const service = app.service('email');

  service.hooks(hooks);
};
