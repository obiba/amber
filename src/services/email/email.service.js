// Initializes the `email` service on path `/email`
const mailer = require('feathers-mailer');
const hooks = require('./email.hooks');
const smtpTransport = require('nodemailer-smtp-transport');
const Transport = require('nodemailer-sendinblue-transport');
const logger = require('../../logger');

module.exports = function (app) {
  // Initialize our service with any options it requires
  let transport;
  logger.info('Initializing email service');
  if (process.env.GMAIL) {
    transport = smtpTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASSWORD
      }
    });
  } else if (process.env.SENDINBLUE_API_KEY) {
    transport = new Transport({
      apiKey: process.env.SENDINBLUE_API_KEY
    });
  } else {
    const smtpOpts = app.get('smtp');
    const smtpConfig = {
      host: process.env.SMTP_HOST || smtpOpts.host,
      name: process.env.SMTP_NAME || smtpOpts.name,
      secure: process.env.SMTP_SECURE !== undefined ? (process.env.SMTP_SECURE === true || process.env.SMTP_SECURE === 'true') : smtpOpts.secure,
      requireTLS: process.env.SMTP_REQUIRE_TLS !== undefined ? (process.env.SMTP_REQUIRE_TLS === true || process.env.SMTP_REQUIRE_TLS === 'true') : smtpOpts.require_tls,
      logger: process.env.SMTP_LOGGER !== undefined ? (process.env.SMTP_LOGGER === true || process.env.SMTP_LOGGER === 'true') : smtpOpts.logger,
      debug: process.env.SMTP_DEBUG !== undefined ? (process.env.SMTP_DEBUG === true || process.env.SMTP_DEBUG === 'true') : smtpOpts.debug,
    };
    if (process.env.SMTP_PORT || smtpOpts.port) {
      smtpConfig.port = process.env.SMTP_PORT || smtpOpts.port;
    }
    if (process.env.SMTP_USER || smtpOpts.user) {
      smtpConfig.auth = {
        user: process.env.SMTP_USER || smtpOpts.user,
        pass: process.env.SMTP_PASSWORD || smtpOpts.pw,
      };
    }
    transport = smtpTransport(smtpConfig);
  }
  app.use(
    '/email',
    mailer(transport)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('email');

  service.hooks(hooks);
};
