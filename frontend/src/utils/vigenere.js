// utils/vigenere.js

export function vigenereEncrypt(text, key) {
  const result = [];
  for (let i = 0; i < text.length; i++) {
    const tChar = text.charCodeAt(i);
    const kChar = key.charCodeAt(i % key.length);
    result.push(String.fromCharCode((tChar + kChar) % 256));
  }
  return result.join('');
}

export function vigenereDecrypt(ciphertext, key) {
  const result = [];
  for (let i = 0; i < ciphertext.length; i++) {
    const cChar = ciphertext.charCodeAt(i);
    const kChar = key.charCodeAt(i % key.length);
    result.push(String.fromCharCode((cChar - kChar + 256) % 256));
  }
  return result.join('');
}
