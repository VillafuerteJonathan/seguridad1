const db = require('../db'); 
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');


const register = async (req, res) => {
  const { username, email, password } = req.body;
  const role = 'user';

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); 
    const secret = speakeasy.generateSecret({ length: 20 });
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: 'NombreDeTuApp',
      issuer: 'TuEmpresa',
      encoding: 'base32',
    });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    const sql = 'INSERT INTO users (username, email, password, two_factor_secret, role) VALUES (?, ?, ?, ?, ?)';
    await db.query(sql, [username, email, hashedPassword, secret.base32, role]);

    const [[nuevoUsuario]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    await db.query(
      `INSERT INTO audit_logs (user_id, action, description, ip_address, timestamp)
      VALUES (?, 'register', ?, ?, NOW())`,
      [
        nuevoUsuario.id,
        `Nuevo usuario registrado con el correo ${email}`,
        req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
      ]
    );
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
  const { userId, newRole, adminId } = req.body;

  if (!userId || !newRole || !adminId) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  if (!['user', 'admin'].includes(newRole)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  try {
    const [targetUser] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
    if (targetUser.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);

    const logSQL = `
      INSERT INTO audit_logs (user_id, action, description, ip_address, timestamp)
      VALUES (?, 'change-role', ?, ?, NOW())
    `;
    const logValues = [
      Number(adminId),
      `El administrador cambió el rol de ${targetUser[0].username} a ${newRole}`,
      req.ip || req.headers['x-forwarded-for'] || 'IP no disponible'
    ];

    await db.query(logSQL, logValues);
    res.status(200).json({ message: 'Rol actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar el rol:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};


module.exports = { register, updateUserRole };
