const db = require('../db');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

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
    if (password !== user.password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Validar 2FA si está habilitado
    if (user.two_factor_secret) {
      if (!token) {
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
        return res.status(400).json({ message: 'Código de 2FA incorrecto' });
      }
    }

    // Generar JWT
    const payload = { userId: user.id, email: user.email, role: user.role };
    const authToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    // Omitir campos sensibles
    const { password: _, two_factor_secret: __, ...userWithoutSensitive } = user;

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
