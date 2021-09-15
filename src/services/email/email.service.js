// Initializes the `email` service on path `/email`
const Mailer = require('feathers-mailer');
const hooks = require('./email.hooks');
const smtpTransport = require('nodemailer-smtp-transport');

module.exports = function (app) {
  // Initialize our service with any options it requires
  let mailerConfig;
  if (process.env.GMAIL) {
    mailerConfig = {
      service: 'gmail',
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASSWORD
      }
    };
  } else {
    mailerConfig = {
      host: app.get('smtp_host'),
      secure: true,
      auth: {
        user: app.get('smtp_user'),
        pass: app.get('smtp_pw'),
      }
    };
  }
  app.use(
    '/email',
    Mailer(smtpTransport(mailerConfig))
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('email');

  service.hooks(hooks);
};
