const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Asegúrate de importar tu conexión a la base de datos

const router = express.Router();

// Habilitar 2FA
router.post('/enable-2fa', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
  }

  try {
    const secret = speakeasy.generateSecret({ length: 20 });

    const sql = 'UPDATE users SET two_factor_secret = ? WHERE email = ?';
    db.query(sql, [secret.base32, email], (err, result) => {
      if (err) {
        console.error('Error habilitando 2FA:', err);
        return res.status(500).json({ message: 'Error habilitando 2FA' });
      }

      const otpauthUrl = speakeasy.otpauthURL({
        secret: secret.base32,
        label: encodeURIComponent('TuApp'),
        issuer: 'TuApp',
        encoding: 'base32',
      });

      qrcode.toDataURL(otpauthUrl, (err, dataUrl) => {
        if (err) {
          console.error('Error generando el código QR:', err);
          return res.status(500).json({ message: 'Error generando el código QR' });
        }

        res.status(200).json({
          message: '2FA habilitado exitosamente',
          qrCode: dataUrl,
          secret: secret.base32,
          requires2FA: true,
        });
      });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Deshabilitar 2FA
router.post('/disable-2fa', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
  }

  try {
    const sql = 'UPDATE users SET two_factor_secret = NULL WHERE email = ?';
    db.query(sql, [email], (err, result) => {
      if (err) {
        console.error('Error deshabilitando 2FA:', err);
        return res.status(500).json({ message: 'Error deshabilitando 2FA' });
      }

      res.status(200).json({ message: '2FA deshabilitado exitosamente' });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Verificar código 2FA
router.post('/verify-2fa', async (req, res) => {
  const { email, token } = req.body;

  if (!email || !token) {
    return res.status(400).json({ message: 'El correo electrónico y el token son obligatorios' });
  }

  try {
    const sql = 'SELECT two_factor_secret FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error('Error obteniendo el secreto 2FA:', err);
        return res.status(500).json({ message: 'Error obteniendo el secreto 2FA' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const user = results[0];

      if (!user.two_factor_secret) {
        return res.status(400).json({ message: '2FA no está habilitado para este usuario' });
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: token,
        window: 2,
      });

      if (!verified) {
        return res.status(401).json({ message: 'Código 2FA inválido' });
      }

      const sqlUser = 'SELECT id, username, email, role FROM users WHERE email = ?';
      db.query(sqlUser, [email], (err, userResult) => {
        if (err) {
          console.error('Error obteniendo datos del usuario:', err);
          return res.status(500).json({ message: 'Error obteniendo los datos del usuario' });
        }

        if (userResult.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado tras verificación' });
        }

        const userData = userResult[0];

        const payload = { email: userData.email, role: userData.role };
        const authToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_secret_key', {
          expiresIn: '1h',
        });

        res.status(200).json({
          message: 'Código 2FA verificado exitosamente',
          token: authToken,
          user: userData,
        });
      });
    });
  } catch (error) {
    console.error('Error en el servidor durante la verificación de 2FA:', error);
    res.status(500).json({ message: 'Error en el servidor. Inténtalo de nuevo más tarde.' });
  }
});

// Obtener QR
router.get('/get-qr-code', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
  }

  try {
    const sql = 'SELECT two_factor_secret FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error('Error obteniendo el secreto 2FA:', err);
        return res.status(500).json({ message: 'Error obteniendo el secreto 2FA' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const user = results[0];

      if (!user.two_factor_secret) {
        return res.status(400).json({ message: '2FA no está habilitado para este usuario' });
      }

      const otpauthUrl = speakeasy.otpauthURL({
        secret: user.two_factor_secret,
        label: 'TuApp',
        issuer: 'TuApp',
        encoding: 'base32',
      });

      qrcode.toDataURL(otpauthUrl, (err, dataUrl) => {
        if (err) {
          console.error('Error generando el código QR:', err);
          return res.status(500).json({ message: 'Error generando el código QR' });
        }

        res.status(200).json({
          message: 'Código QR generado exitosamente',
          qrCode: dataUrl,
        });
      });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;
