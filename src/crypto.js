const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const iv = crypto.randomBytes(16);

const makeEncrypt = (secretKey) => {
  return (text) => {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex')
    };
  };
};

const makeDecrypt = (secretKey) => {
  return (hash) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrpyted.toString();
  };
};

module.exports = function (app) {
  const key = crypto.createHash('sha256').update(String(app.get('authentication').secret)).digest('base64').substr(0, 32);
  const cryptoConfig = {
    encrypt: makeEncrypt(key),
    decrypt: makeDecrypt(key)
  };
  app.set('crypto', cryptoConfig);
};