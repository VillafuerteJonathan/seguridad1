const db = require('../db'); // Ahora es db con soporte para await
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const register = async (req, res) => {
  const { username, email, password } = req.body;
  const role = 'user'; 

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const secret = speakeasy.generateSecret({ length: 20 });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: 'NombreDeTuApp',
      issuer: 'TuEmpresa',
      encoding: 'base32',
    });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    const sql = 'INSERT INTO users (username, email, password, two_factor_secret, role) VALUES (?, ?, ?, ?, ?)';
    await db.query(sql, [username, email, password, secret.base32, role]); // 👈 await

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      qrCode: qrCodeDataUrl,
      secret: secret.base32,
    });

  } catch (error) {
    console.error('Error en registro:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const updateUserRole = async (req, res) => {
  const { userId, newRole } = req.body;

  if (!['user', 'admin'].includes(newRole)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
    res.status(200).json({ message: 'Rol actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar el rol:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};


module.exports = { register, updateUserRole };
