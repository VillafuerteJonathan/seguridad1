const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Asegúrate de importar tu conexión a la base de datos

const router = express.Router();
router.post('/enable-2fa', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
  }

  try {
    // Generar un nuevo secreto para 2FA
    const secret = speakeasy.generateSecret({ length: 20 });

    // Actualizar el usuario en la base de datos
    const sql = 'UPDATE users SET two_factor_secret = ? WHERE email = ?';
    db.query(sql, [secret.base32, email], (err, result) => {
      if (err) {
        console.error('Error habilitando 2FA:', err);
        return res.status(500).json({ message: 'Error habilitando 2FA' });
      }

      // Generar un código QR para que el usuario escanee
      const otpauthUrl = speakeasy.otpauthURL({
        secret: secret.base32,
        label: encodeURIComponent('TuApp'), // Nombre de tu aplicación
        issuer: 'TuApp', // Nombre de tu empresa
        encoding: 'base32',
      });

      qrcode.toDataURL(otpauthUrl, (err, dataUrl) => {
        if (err) {
          console.error('Error generando el código QR:', err);
          return res.status(500).json({ message: 'Error generando el código QR' });
        }

        // Devolver el código QR en la respuesta
        res.status(200).json({
          message: '2FA habilitado exitosamente',
          qrCode: dataUrl, // Código QR en formato base64
          secret: secret.base32, // Secreto 2FA (opcional, para fines de depuración)
          requires2FA: true, // Indicar que el 2FA está habilitado
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
    // Eliminar el secreto 2FA del usuario
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
    // Obtener el secreto 2FA del usuario desde la base de datos
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

      // Verificar el código 2FA
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: token,
        window: 2, // Permite un margen de error de 2 pasos (1 minuto)
      });

      if (verified) {
        // Si el código es válido, generar un JWT y enviarlo al frontend
        const payload = { email: email };
        const authToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1h' });

        res.status(200).json({
          message: 'Código 2FA verificado exitosamente',
          token: authToken, // JWT para autenticar al usuario
        });
      } else {
        res.status(401).json({ message: 'Código 2FA inválido' });
      }
    });
  } catch (error) {
    console.error('Error en el servidor durante la verificación de 2FA:', error);
    res.status(500).json({ message: 'Error en el servidor. Inténtalo de nuevo más tarde.' });
  }
});

// Obtener el código QR (opcional, si el frontend necesita regenerar el QR)
router.get('/get-qr-code', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
  }

  try {
    // Obtener el secreto 2FA del usuario desde la base de datos
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

      // Generar la URL OTP para el código QR
      const otpauthUrl = speakeasy.otpauthURL({
        secret: user.two_factor_secret,
        label: 'TuApp', // Nombre de tu aplicación
        issuer: 'TuApp', // Nombre de tu empresa
        encoding: 'base32',
      });

      // Generar el código QR en formato base64
      qrcode.toDataURL(otpauthUrl, (err, dataUrl) => {
        if (err) {
          console.error('Error generando el código QR:', err);
          return res.status(500).json({ message: 'Error generando el código QR' });
        }

        // Devolver el código QR en la respuesta
        res.status(200).json({
          message: 'Código QR generado exitosamente',
          qrCode: dataUrl, // Código QR en formato base64
        });
      });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;