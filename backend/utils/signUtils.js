const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRIVATE_KEY = fs.readFileSync(path.join(__dirname, '../private.pem'), 'utf-8');

function firmarBuffer(buffer) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(buffer);
  sign.end();
  const signature = sign.sign(PRIVATE_KEY);
  return signature.toString('base64');  
}

module.exports = { firmarBuffer };

