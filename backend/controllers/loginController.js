const db = require('../db');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

const login = async (req, res) => {
  const { email, password, token } = req.body;

  // Validar que todos los campos obligatorios estén presentes
  if (!email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Buscar al usuario en la base de datos
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, result) => {
      if (err) {
        console.error('Error en la consulta SQL:', err);
        return res.status(500).json({ message: 'Error en el servidor' });
      }

      // Verificar si el usuario existe
      if (result.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const user = result[0];

      // Verificar la contraseña (en este caso, sin hashing)
      if (password !== user.password) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // Verificar si el 2FA está habilitado
      if (user.two_factor_secret) {
        // Si no se proporciona el token de 2FA, solicitar al usuario que lo ingrese
        if (!token) {
          return res.status(200).json({
            message: 'Por favor, ingresa tu código 2FA',
            requires2FA: true, // Indicar que se requiere 2FA
            email: user.email, // Enviar el email para usarlo en la verificación
          });
        }

        // Verificar el código de 2FA
        const verified = speakeasy.totp.verify({
          secret: user.two_factor_secret, // Secreto almacenado en la base de datos
          encoding: 'base32',
          token: token, // Código ingresado por el usuario
          window: 1, // Margen de tiempo para códigos anteriores/siguientes
        });

        if (!verified) {
          return res.status(400).json({ message: 'Código de 2FA incorrecto' });
        }
      }

      // Si el 2FA es correcto o no está habilitado, generar un JWT
      const payload = { userId: user.id, email: user.email };
      const authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Enviar el token como respuesta
      return res.status(200).json({
        message: 'Inicio de sesión exitoso',
        token: authToken,
      });
    });
  } catch (error) {
    console.error('Error en el proceso de inicio de sesión:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { login };