const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Usa conexión con promesas

const router = express.Router();

// Habilitar 2FA
router.post('/enable-2fa', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'El correo electrónico es obligatorio' });

  try {
    const secret = speakeasy.generateSecret({ length: 20 });

    await db.query('UPDATE users SET two_factor_secret = ? WHERE email = ?', [secret.base32, email]);

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: encodeURIComponent('TuApp'),
      issuer: 'TuApp',
      encoding: 'base32',
    });

    const qrCode = await qrcode.toDataURL(otpauthUrl);

    res.status(200).json({
      message: '2FA habilitado exitosamente',
      qrCode,
      secret: secret.base32,
      requires2FA: true,
    });
  } catch (error) {
    console.error('Error habilitando 2FA:', error);
    res.status(500).json({ message: 'Error habilitando 2FA' });
  }
});

// Deshabilitar 2FA
router.post('/disable-2fa', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'El correo electrónico es obligatorio' });

  try {
    await db.query('UPDATE users SET two_factor_secret = NULL WHERE email = ?', [email]);
    res.status(200).json({ message: '2FA deshabilitado exitosamente' });
  } catch (error) {
    console.error('Error deshabilitando 2FA:', error);
    res.status(500).json({ message: 'Error deshabilitando 2FA' });
  }
});

// Verificar código 2FA
router.post('/verify-2fa', async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ message: 'El correo electrónico y el token son obligatorios' });

  try {
    const [results] = await db.query('SELECT two_factor_secret FROM users WHERE email = ?', [email]);
    if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const user = results[0];
    if (!user.two_factor_secret) return res.status(400).json({ message: '2FA no está habilitado para este usuario' });

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) return res.status(401).json({ message: 'Código 2FA inválido' });

    const [userResult] = await db.query('SELECT id, username, email, role FROM users WHERE email = ?', [email]);
    if (userResult.length === 0) return res.status(404).json({ message: 'Usuario no encontrado tras verificación' });

    const userData = userResult[0];
    const payload = { email: userData.email, role: userData.role };
    const authToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1h' });

    res.status(200).json({
      message: 'Código 2FA verificado exitosamente',
      token: authToken,
      user: userData,
    });
  } catch (error) {
    console.error('Error verificando 2FA:', error);
    res.status(500).json({ message: 'Error en el servidor. Inténtalo de nuevo más tarde.' });
  }
});

// Obtener QR
router.get('/get-qr-code', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'El correo electrónico es obligatorio' });

  try {
    const [results] = await db.query('SELECT two_factor_secret FROM users WHERE email = ?', [email]);
    if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const user = results[0];
    if (!user.two_factor_secret) return res.status(400).json({ message: '2FA no está habilitado para este usuario' });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: user.two_factor_secret,
      label: 'Repositorio Seguro',
      issuer: 'Repositorio Seguro',
      encoding: 'base32',
    });

    const qrCode = await qrcode.toDataURL(otpauthUrl);

    res.status(200).json({
      message: 'Código QR generado exitosamente',
      qrCode,
    });
  } catch (error) {
    console.error('Error obteniendo QR:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;
