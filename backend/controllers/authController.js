const db = require('../db');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const secret = speakeasy.generateSecret({ length: 20 });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: 'NombreDeTuApp',
      issuer: 'TuEmpresa',
      encoding: 'base32',
    });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    const sql = 'INSERT INTO users (username, email, password, two_factor_secret, role) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [username, email, password, secret.base32, role], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }
        return res.status(500).json({ message: 'Error registrando al usuario' });
      }

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        qrCode: qrCodeDataUrl,
        secret: secret.base32,
      });
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { register };
