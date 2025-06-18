// utils/cryptoUtils.js
const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // Clave de 32 bytes (256 bits)
const iv = crypto.randomBytes(16); // Vector de inicialización de 16 bytes

const encryptFile = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(inputPath);
    const writeStream = fs.createWriteStream(outputPath);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    readStream
      .pipe(cipher)
      .pipe(writeStream)
      .on('finish', () => {
        resolve({ iv: iv.toString('hex'), key: key.toString('hex') });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

module.exports = { encryptFile };