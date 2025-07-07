const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');

const PUBLIC_KEY = fs.readFileSync(path.join(__dirname, '../public.pem'), 'utf-8');

exports.verifySignature = async (req, res) => {
  const { fileId } = req.body;
  if (!fileId) return res.status(400).json({ valid: false, message: 'Falta fileId' });

  try {
    const [rows] = await db.query('SELECT encrypted_content, signature FROM files WHERE id = ?', [fileId]);
    const file = rows[0];
    if (!file) return res.status(404).json({ valid: false, message: 'Archivo no encontrado' });

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(Buffer.from(file.encrypted_content, 'base64'));
    verify.end();
    const isValid = verify.verify(PUBLIC_KEY, Buffer.from(file.signature, 'base64'));

    res.json({ valid: isValid });
  } catch (err) {
    console.error('Error en verificación de firma:', err);
    res.status(500).json({ valid: false, message: 'Error interno' });
  }
};
