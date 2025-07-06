const db = require('../db');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
  const { email, password, token } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0];

    // Validar contraseña (considera usar bcrypt para hash en producción)
    const validPassword = await bcrypt.compare(password, user.password);
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
    const [results] = await db.query('SELECT id, username, email, role FROM users');
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
