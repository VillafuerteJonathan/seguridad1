const db = require('../db');

const register = async (req, res) => {
  console.log('Datos recibidos:', req.body); // Depuración
  const { username, email, password } = req.body;

  // Validar que todos los campos estén presentes
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  // Insertar el usuario en la base de datos
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, password], (err, result) => {
    if (err) {
      console.error('Error en la consulta SQL:', err); // Depuración
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
      }
      return res.status(500).json({ message: 'Error registrando al usuario' });
    }
    console.log('Usuario registrado:', result); // Depuración
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  });
};

module.exports = { register };