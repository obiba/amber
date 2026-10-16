const crypto = require('crypto');

const algorithm = 'aes-256-ctr';

const makeEncrypt = (secretKey, secretIv) => {
  return (text) => {
    const cipher = crypto.createCipheriv(algorithm, secretKey, secretIv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return encrypted.toString('hex');
  };
};

const makeDecrypt = (secretKey, secretIv) => {
  return (hash) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, secretIv);
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);

    return decrpyted.toString();
  };
};

module.exports = function (app) {
  const key = crypto.createHash('sha512').update(String(app.get('authentication').secret), 'utf-8').digest('hex').substring(0, 32);
  const iv  = crypto.createHash('sha512').update(String(app.get('encrypt_iv')), 'utf-8').digest('hex').substring(0, 16);
  const cryptoConfig = {
    encrypt: makeEncrypt(key, iv),
    decrypt: makeDecrypt(key, iv)
  };
  app.set('crypto', cryptoConfig);
};