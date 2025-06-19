const db = require('../db');

exports.uploadFile = (req, res) => {
  try {
    const { user, filename, content } = req.body; // No recibimos 'clave' por seguridad

    if (!user || !filename || !content) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    // Parsear user si viene como string JSON
    const userObj = typeof user === 'string' ? JSON.parse(user) : user;

    if (!userObj || !userObj.id) {
      return res.status(400).json({ message: 'Usuario inválido' });
    }

    // Obtener extensión original del archivo
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

      // Registrar auditoría (log)
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
          // No bloqueamos respuesta por error en auditoría
        }
        return res.json({ message: 'Archivo subido exitosamente', fileId: result.insertId });
      });
    });
  } catch (error) {
    console.error('Error en uploadFile:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.getUserFiles = (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: "Falta el ID del usuario" });
  }

  const sql = `
    SELECT id, filename, uploaded_at, access_level, original_extension, status, encrypted_content
    FROM files
    WHERE uploaded_by = ?
    ORDER BY uploaded_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error al obtener archivos:', err);
      return res.status(500).json({ message: "Error al obtener archivos" });
    }
    // Devolver el contenido cifrado tal cual
    res.json(results);
  });
};
