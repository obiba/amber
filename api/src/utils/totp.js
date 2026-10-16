/**
 * TOTP utility module using otplib v13
 * Replaces feathers-totp-2fa functionality
 */

const { generateSecret, generate, verify, generateURI, generateSync, verifySync } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate a new TOTP secret
 * @param {number} length - Number of random bytes (default: 20)
 * @returns {string} Base32-encoded secret
 */
function createSecret(length = 20) {
  return generateSecret({ length });
}

/**
 * Generate a TOTP token from a secret (async)
 * @param {string} secret - Base32-encoded secret
 * @returns {Promise<string>} 6-digit TOTP token
 */
async function generateToken(secret) {
  return generate({ secret });
}

/**
 * Generate a TOTP token from a secret (sync)
 * @param {string} secret - Base32-encoded secret
 * @returns {string} 6-digit TOTP token
 */
function generateTokenSync(secret) {
  return generateSync({ secret });
}

/**
 * Verify a TOTP token (async)
 * @param {string} secret - Base32-encoded secret
 * @param {string} token - Token to verify
 * @param {number} epochTolerance - Time window tolerance in seconds (default: 30)
 * @returns {Promise<boolean>} True if valid
 */
async function verifyToken(secret, token, epochTolerance = 30) {
  const result = await verify({ secret, token, epochTolerance });
  return result.valid;
}

/**
 * Verify a TOTP token (sync)
 * @param {string} secret - Base32-encoded secret
 * @param {string} token - Token to verify
 * @param {number} epochTolerance - Time window tolerance in seconds (default: 30)
 * @returns {boolean} True if valid
 */
function verifyTokenSync(secret, token, epochTolerance = 30) {
  const result = verifySync({ secret, token, epochTolerance });
  return result.valid;
}

/**
 * Generate otpauth:// URI for QR code
 * @param {string} secret - Base32-encoded secret
 * @param {string} issuer - Service/application name
 * @param {string} label - User identifier (email, username, etc.)
 * @returns {string} otpauth:// URI
 */
function createKeyURI(secret, issuer, label) {
  return generateURI({
    issuer,
    label,
    secret
  });
}

/**
 * Generate a QR code data URL for the TOTP secret
 * @param {string} secret - Base32-encoded secret
 * @param {string} issuer - Service/application name
 * @param {string} label - User identifier (email, username, etc.)
 * @returns {Promise<string>} Data URL of QR code image
 */
async function generateQRCode(secret, issuer, label) {
  const uri = createKeyURI(secret, issuer, label);
  return QRCode.toDataURL(uri);
}

/**
 * Encrypt a secret using the app's crypto utility
 * @param {Object} crypto - Crypto utility from app.get('crypto')
 * @param {string} secret - Plain text secret
 * @returns {string} Encrypted secret
 */
function encryptSecret(crypto, secret) {
  if (crypto && crypto.encrypt) {
    return crypto.encrypt(secret);
  }
  return secret;
}

/**
 * Decrypt a secret using the app's crypto utility
 * @param {Object} crypto - Crypto utility from app.get('crypto')
 * @param {string} encryptedSecret - Encrypted secret
 * @returns {string} Decrypted secret
 */
function decryptSecret(crypto, encryptedSecret) {
  if (crypto && crypto.decrypt) {
    return crypto.decrypt(encryptedSecret);
  }
  return encryptedSecret;
}

/**
 * Generate a random numeric code (for email OTP, not TOTP-based)
 * @param {number} digits - Number of digits (default: 6)
 * @returns {string} Random numeric code
 */
function generateRandomCode(digits = 6) {
  const max = Math.pow(10, digits);
  const min = Math.pow(10, digits - 1);
  const code = crypto.randomInt(min, max);
  return code.toString();
}

module.exports = {
  createSecret,
  generateToken,
  generateTokenSync,
  verifyToken,
  verifyTokenSync,
  createKeyURI,
  generateQRCode,
  encryptSecret,
  decryptSecret,
  generateRandomCode
};
