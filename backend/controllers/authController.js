const db = require('../db');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const register = async (req, res) => {
  console.log('Datos recibidos:', req.body); // Depuración
  const { username, email, password } = req.body;

  // Validar que todos los campos estén presentes
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // 1. Generar el secreto 2FA
    const secret = speakeasy.generateSecret({ length: 20 });

    // 2. Generar la URL OTP
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: 'NombreDeTuApp', // Nombre de tu aplicación
      issuer: 'TuEmpresa', // Nombre de tu empresa
      encoding: 'base32',
    });

    // 3. Generar el código QR
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    // 4. Insertar el usuario en la base de datos
    const sql = 'INSERT INTO users (username, email, password, two_factor_secret) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, email, password, secret.base32], (err, result) => {
      if (err) {
        console.error('Error en la consulta SQL:', err); // Depuración
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }
        return res.status(500).json({ message: 'Error registrando al usuario' });
      }

      // 5. Enviar respuesta al cliente
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        qrCode: qrCodeDataUrl, // Código QR en formato base64
        secret: secret.base32, // Secreto 2FA (opcional, para fines de depuración)
      });
    });
  } catch (error) {
    console.error('Error en el proceso de registro:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { register };