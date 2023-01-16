// Initializes the `email` service on path `/email`
const mailer = require('feathers-mailer');
const hooks = require('./email.hooks');
const smtpTransport = require('nodemailer-smtp-transport');
const sibTransport = require('nodemailer-sendinblue-v3-transport');

module.exports = function (app) {
  // Initialize our service with any options it requires
  let transport;
  if (process.env.GMAIL) {
    transport = smtpTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASSWORD
      }
    });
  } else if (process.env.SENDINBLUE_API_KEY) {
    transport = sibTransport({
      apiKey: process.env.SENDINBLUE_API_KEY,
      apiUrl: 'https://api.sendinblue.com/v3/smtp'
    });
  } else {
    const smtpOpts = app.get('smtp');
    transport = smtpTransport({
      host: process.env.SMTP_HOST ? process.env.SMTP_HOST : smtpOpts.host,
      name: process.env.SMTP_NAME ? process.env.SMTP_NAME : smtpOpts.name,
      secure: process.env.SMTP_SECURE !== undefined ? (process.env.SMTP_SECURE === true || process.env.SMTP_SECURE === 'true') : smtpOpts.secure,
      requireTLS: process.env.SMTP_REQUIRE_TLS !== undefined ? (process.env.SMTP_REQUIRE_TLS === true || process.env.SMTP_REQUIRE_TLS === 'true') : smtpOpts.require_tls,
      logger: process.env.SMTP_LOGGER !== undefined ? (process.env.SMTP_LOGGER === true || process.env.SMTP_LOGGER === 'true') : smtpOpts.logger,
      debug: process.env.SMTP_DEBUG !== undefined ? (process.env.SMTP_DEBUG === true || process.env.SMTP_DEBUG === 'true') : smtpOpts.debug,
      auth: {
        user: process.env.SMTP_USER ? process.env.SMTP_USER : smtpOpts.user,
        pass: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD : smtpOpts.pw,
      }
    });
  }
  app.use(
    '/email',
    mailer(transport)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('email');

  service.hooks(hooks);
};
