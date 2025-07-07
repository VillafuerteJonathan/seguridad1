const db = require('../db');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt');
require('dotenv').config();
const CryptoJS = require('crypto-js');

const AES_SECRET = process.env.AES_SECRET_KEY;

const login = async (req, res) => {
  const { email, password, token } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const decryptedEmail = CryptoJS.AES.decrypt(email, AES_SECRET).toString(CryptoJS.enc.Utf8);
    const decryptedPassword = CryptoJS.AES.decrypt(password, AES_SECRET).toString(CryptoJS.enc.Utf8);

    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [decryptedEmail]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0];
    const [[perm]] = await db.query(
      'SELECT can_login FROM user_permissions WHERE user_id = ?',
      [user.id]
    );

    if (!perm || perm.can_login !== 1) {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, description, ip_address, timestamp)
        VALUES (?, 'login', ?, ?, NOW())`,
        [
          user.id,
          `Intento de inicio de sesión rechazado por permisos`,
          req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
        ]
      );
      return res.status(403).json({
        message: 'Tu cuenta aún no ha sido habilitada por un administrador.',
      });
    }


    const validPassword = await bcrypt.compare(decryptedPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }


    // Validar 2FA si está habilitado
    if (user.two_factor_secret) {
      if (!token) {
        try {
          await db.query(
            `INSERT INTO audit_logs (user_id, action, description, ip_address, timestamp)
            VALUES (?, 'login', ?, ?, NOW())`,
            [
              user.id,
              `Usuario ingresó credenciales válidas`,
              req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
            ]
          );
        } catch (logErr) {
          console.error('Error al registrar auditoría de login pendiente 2FA:', logErr);
        }
        return res.status(200).json({
          message: 'Por favor, ingresa tu código 2FA',
          requires2FA: true,
          email: user.email,
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token,
        window: 1,
      });

      if (!verified) {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, description, ip_address, timestamp)
          VALUES (?, 'login', ?, ?, NOW())`,
          [
            user.id,
            `Código 2FA incorrecto al intentar iniciar sesión`,
            req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
          ]
        );

        return res.status(400).json({ message: 'Código de 2FA incorrecto' });
      }
      await db.query(
        `INSERT INTO audit_logs (user_id, action, description, ip_address, timestamp)
        VALUES (?, 'login', ?, ?, NOW())`,
        [
          user.id,
          `Código 2FA verificado correctamente`,
            req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
        ]
      );

    }

    // Generar JWT
    const payload = { userId: user.id, email: user.email, role: user.role };
    const authToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    // Omitir campos sensibles
    const { password: _, two_factor_secret: __, ...userWithoutSensitive } = user;
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, description, ip_address, timestamp)
          VALUES (?, 'login', ?, ?, NOW())`,
          [
            user.id,
            `El usuario inició sesión correctamente`,
            req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
          ]
        );
      } catch (logErr) {
        console.error('Error al registrar auditoría de login:', logErr);
      }

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token: authToken,
      user: userWithoutSensitive,
    });
  } catch (error) {
    console.error('Error en el proceso de inicio de sesión:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        up.can_login
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
    `);

    res.status(200).json(results);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  login,
  getAllUsers,
};
