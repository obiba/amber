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
      host: app.get('smtp_host'),
      secure: true,
      auth: {
        user: app.get('smtp_user'),
        pass: app.get('smtp_pw'),
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
