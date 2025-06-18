const db = require('../db');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

const login = async (req, res) => {
  const { email, password, token ,role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error('Error en la consulta SQL:', err);
        return res.status(500).json({ message: 'Error en el servidor' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const user = results[0];

      // Validar contraseña
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
          userWithoutSensitive
          
        });

        if (!verified) {
          return res.status(400).json({ message: 'Código de 2FA incorrecto' });
        }
      }

      const payload = { userId: user.id, email: user.email, role: user.role };
      const authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Omitir password y two_factor_secret al devolver datos
      const { password: _, two_factor_secret: __, ...userWithoutSensitive } = user;

      // Loguear la respuesta que se enviará al frontend
      const responsePayload = {
        message: 'Inicio de sesión exitoso',
        token: authToken,
        user: userWithoutSensitive,
       
      };

      

      return res.status(200).json(responsePayload);
    });
  } catch (error) {
    console.error('Error en el proceso de inicio de sesión:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

const getAllUsers = (req, res) => {
  const sql = 'SELECT id, username, email, role FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return res.status(500).json({ message: 'Error del servidor' });
    }
    res.status(200).json(results);
  });
};

module.exports = {
  login,
  getAllUsers,
};
