var format = require('string-template');

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
        console.log('Sent email', result);
      })
      .catch((err) => {
        console.log('Error sending email', err);
      });
  }
  const FROM_EMAIL = app.get('from_email');

  return {
    service: 'user',
    notifier: function (type, user) {
      let email;
      console.log('type', type);
      const emailTemplates = app.get('email_templates');
      const subject = emailTemplates[type][user.language] ? emailTemplates[type][user.language].subject : emailTemplates[type].en;
      const html = emailTemplates[type][user.language] ? emailTemplates[type][user.language].html : emailTemplates[type].en;
      const context = {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        language: user.language,
        role: user.role
      };
      switch (type) {
      case 'resendVerifySignup':
        //sending the user the verification email
        console.log('user', user);
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
        console.log('user', user);
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
        console.log('user', user);
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
