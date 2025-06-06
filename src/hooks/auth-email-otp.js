const logger = require('../logger');
const { BadRequest } = require('@feathersjs/errors');
const { MailBuilder } = require('../utils/mail');
const { authenticator } = require('otplib');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return (context) => {
    if (!context.data || !context.result || context.data.strategy !== 'local') {
      return context;
    }

    if (context.result.user) {
      if (context.result.user.with2fa === false) {
        // 2FA is disabled, no need to check OTP
        return context;
      }
      // check if OTP by email is enabled
      const timeout = process.env.OTP_TIMEOUT === undefined ? context.app.get('authentication').otpTimeout : parseInt(process.env.OTP_TIMEOUT);
      if (timeout <= 0) {
        return context;
      }

      const user = context.result.user;
      // when TOTP 2FA is not set, enforce security with a token sent by email
      // when TOTP 2FA is set, allow security with a token sent by email only if the user has not activated its 2FA secret 
      if (!user.totp2faRequired || (!user.totp2faSecret && context.data.method === 'otp')) {
        const usersService = context.app.service('user');
        const crypto = context.app.get('crypto');
        if (context.data.token === undefined) {
          // send the token by email
          const code = authenticator.generate(user._id.toString());
          const otp = {
            token: code,
            timestamp: Date.now()
          };
          logger.debug('OTP token sent by email to ' + user.email + ': ' + otp.token);
          usersService.patch(user._id.toString(), { otp: crypto.encrypt(JSON.stringify(otp)) });
          const builder = new MailBuilder(context.app);
          builder.sendEmail('otp', user, {
            token: otp.token,
            expire: timeout
          });
          throw new BadRequest('Token required.');
        } else if (!user.otp) {
          throw new BadRequest('Invalid token.');
        } else {
          // check the token sent by email
          const otpObj = JSON.parse(crypto.decrypt(user.otp));
          // check token expiration
          const millis = Date.now() - otpObj.timestamp;
          if (millis > timeout * 60 * 1000) {
            delete user.otp;
            usersService.patch(user._id.toString(), { otp: null });
            throw new BadRequest('Invalid token.');
          } else if (!otpObj || context.data.token !== otpObj.token) {
            throw new BadRequest('Invalid token.');
          } else {
            // token is valid, remove it from the user
            delete user.otp;
            usersService.patch(user._id.toString(), { otp: null });
            context.result.otp = true;
          }
        }
      }
    }
    return context;
  };
};