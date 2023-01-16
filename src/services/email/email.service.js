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
    transport = smtpTransport({
      host: process.env.SMTP_HOST ? process.env.SMTP_HOST : app.get('smtp_host'),
      name: process.env.SMTP_NAME ? process.env.SMTP_NAME : "",
      secure: process.env.SMTP_SECURE ? (process.env.SMTP_SECURE === true || process.env.SMTP_SECURE === 'true') : true,
      requireTLS: process.env.SMTP_REQUIRE_TLS ? (process.env.SMTP_REQUIRE_TLS === true || process.env.REQUIRE_TLS === 'true') : false,
      logger: process.env.SMTP_LOGGER ? (process.env.SMTP_LOGGER === true || process.env.LOGGER === 'true') : false,
      debug: process.env.SMTP_DEBUG ? (process.env.SMTP_DEBUG === true || process.env.DEBUG === 'true') : false,
      auth: {
        user: process.env.SMTP_USER ? process.env.SMTP_USER : app.get('smtp_user'),
        pass: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD : app.get('smtp_pw'),
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
