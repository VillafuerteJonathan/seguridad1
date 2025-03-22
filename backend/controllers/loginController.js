const db = require('../db');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;

  // Validar que todos los campos estén presentes
  if (!email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

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

    // Generar un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email }, // Payload (datos del usuario)
      process.env.JWT_SECRET, // Clave secreta
      { expiresIn: '1h' } // Tiempo de expiración del token
    );

    // Enviar el token como respuesta
    res.status(200).json({ token });
  });
};

module.exports = { login };