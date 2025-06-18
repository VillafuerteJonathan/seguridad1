const db = require('../db');
exports.uploadFile = (req, res) => {
  try {
    const { user, filename, content, clave } = req.body;

    if (!user || !filename || !content || !clave) {
      return res.status(400).json({ message: 'Faltan datos' });
    }

    const userObj = JSON.parse(user);
    const ext = '.' + filename.split('.').pop();

    const sql = `
      INSERT INTO files (filename, encrypted_content, uploaded_by, original_extension, uploaded_at, access_level, status)
      VALUES (?, ?, ?, ?, NOW(), 'privado', 'activo')
    `;
    const values = [filename, content, userObj.id, ext];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error al guardar archivo:', err);
        return res.status(500).json({ message: 'Error al guardar archivo en la base de datos' });
      }

      // Insertar auditoría
      const logSql = `
        INSERT INTO audit_logs (user_id, file_id, action, description, ip_address, timestamp)
        VALUES (?, ?, 'upload', ?, ?, NOW())
      `;
      const logValues = [
        userObj.id,
        result.insertId,
        `El usuario subió el archivo ${filename}`,
        req.ip || 'IP no disponible',
      ];

      db.query(logSql, logValues, (logErr) => {
        if (logErr) {
          console.error('Error al registrar auditoría:', logErr);
        }
        return res.json({ message: 'Archivo subido exitosamente', fileId: result.insertId });
      });
    });

  } catch (error) {
    console.error('Error en uploadFile:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
