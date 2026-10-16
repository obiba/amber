/**
 * TOTP 2FA Hook - Replacement for feathers-totp-2fa
 * Uses otplib v13 for TOTP generation and verification
 */

const { BadRequest } = require('@feathersjs/errors');
const { checkContext } = require('feathers-hooks-common');
const { createSecret, verifyToken, generateQRCode, encryptSecret, decryptSecret } = require('../utils/totp');

const defaultOptions = {
  usersService: 'user',
  secretFieldName: 'totp2faSecret',
  requiredFieldName: 'totp2faRequired',
  applicationName: 'Amber App',
  cryptoUtil: null
};

/**
 * Generate QR code and secret for TOTP setup
 * @param {Object} user - User object
 * @param {Object} options - Hook options
 * @returns {Promise<Object>} QR code data URL and secret
 */
async function getQrCodeSecret(user, options) {
  // Generate a new secret if user doesn't have one
  const secret = createSecret();

  // Generate QR code
  const qr = await generateQRCode(secret, options.applicationName, user.email);

  return { qr, secret };
}

/**
 * Verify a TOTP token against a secret
 * @param {string} userToken - Token provided by user
 * @param {string} secret - Base32-encoded secret
 * @returns {Promise<boolean>} True if valid
 */
async function verifyUserToken(userToken, secret) {
  if (!userToken) {
    throw new BadRequest('No token.');
  }
  if (!secret) {
    throw new BadRequest('No secret.');
  }

  return verifyToken(secret, userToken);
}

/**
 * TOTP 2FA Hook
 *
 * To be called in the after hook of the create method in the authentication service
 *
 * @param {Object} options - Configuration options
 * @param {string} options.usersService - Name of users service (default: 'user')
 * @param {string} options.secretFieldName - Field name for TOTP secret (default: 'totp2faSecret')
 * @param {string} options.requiredFieldName - Field name for 2FA required flag (default: 'totp2faRequired')
 * @param {string} options.applicationName - Application name for QR code (default: 'Amber App')
 * @param {Object} options.cryptoUtil - Crypto utility for encrypting/decrypting secrets
 */
function totp2fa(options = {}) {
  options = Object.assign({}, defaultOptions, options);

  return async (context) => {
    // Only run in the after hook of the create method
    checkContext(context, 'after', ['create'], 'totp2fa');

    const { app, data, result } = context;

    const usersService = app.service(options.usersService);
    const usersServiceId = usersService.id || '_id';

    // Only run if login via local strategy
    if (!data || !result || data.strategy !== 'local') {
      return context;
    }

    // Only run with authenticated users
    let { user } = result;

    try {
      user = await usersService._get(user[usersServiceId]);
    } catch {
      throw new BadRequest('User not found.');
    }

    if (!user) {
      return context;
    }

    // Only run if Totp 2FA is required for this user
    if (
      user[options.requiredFieldName] !== undefined &&
      !user[options.requiredFieldName]
    ) {
      return context;
    }

    // Return QR code and secret if user hasn't set up 2FA yet
    if (!data.token && !data.secret && !user[options.secretFieldName]) {
      context.result = {
        data: await getQrCodeSecret(user, options)
      };
      return context;
    }

    // Save secret to user data (initial 2FA setup)
    if (data.secret) {
      if (!data.token) {
        throw new BadRequest('Token required.');
      }
      
      const isValid = await verifyUserToken(data.token, data.secret);
      if (!isValid) {
        throw new BadRequest('Invalid token.');
      }

      if (!user[options.secretFieldName]) {
        const patchData = {};
        const crypto = options.cryptoUtil;
        patchData[options.secretFieldName] = encryptSecret(crypto, data.secret);
        try {
          await usersService._patch(user[usersServiceId], patchData);
        } catch {
          throw new BadRequest('Could not save secret.');
        }
      } else {
        throw new BadRequest('Secret already saved.');
      }

      return context;
    }

    // Verify token against saved secret
    if (data.token) {
      const crypto = options.cryptoUtil;
      const secret = decryptSecret(crypto, user[options.secretFieldName]);
      const isValid = await verifyUserToken(data.token, secret);
      if (!isValid) {
        throw new BadRequest('Invalid token.');
      }
    } else {
      throw new BadRequest('Token required.');
    }

    // Remove secret from result.user
    delete context.result.user[options.secretFieldName];

    return context;
  };
}

module.exports = totp2fa;
