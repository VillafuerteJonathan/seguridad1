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
    WHERE uploaded_by = ? AND status = 'activo'
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
exports.deleteFile = (req, res) => {
  try {
    const { userId, fileId } = req.body;

    if (!userId || !fileId) {
      return res.status(400).json({ message: 'Faltan datos obligatorios: userId o fileId' });
    }

    const fileIdNum = Number(fileId);
    const userIdNum = Number(userId);

    // 1. Verificar que el archivo existe y pertenece al usuario
    const checkSql = `SELECT filename, uploaded_by FROM files WHERE id = ? AND status = 'activo'`;
    db.query(checkSql, [fileIdNum], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error al buscar archivo:', checkErr);
        return res.status(500).json({ message: 'Error al buscar archivo' });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ message: 'Archivo no encontrado o ya eliminado' });
      }

      const file = checkResults[0];

      if (Number(file.uploaded_by) !== userIdNum) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar este archivo' });
      }

      // 2. Marcar archivo como eliminado (status = 'eliminado')
      const deleteSql = `UPDATE files SET status = 'eliminado' WHERE id = ?`;
      db.query(deleteSql, [fileIdNum], (delErr) => {
        if (delErr) {
          console.error('Error al eliminar archivo:', delErr);
          return res.status(500).json({ message: 'Error al eliminar archivo' });
        }

        // 3. Registrar auditoría
        const logSql = `
          INSERT INTO audit_logs (user_id, file_id, action, description, ip_address, timestamp)
          VALUES (?, ?, 'delete', ?, ?, NOW())
        `;
        const logValues = [
          userIdNum,
          fileIdNum,
          `El usuario eliminó el archivo ${file.filename}`,
          req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
        ];

        db.query(logSql, logValues, (logErr) => {
          if (logErr) {
            console.error('Error al registrar auditoría:', logErr);
            // Continuamos igual aunque falle la auditoría
          }

          return res.json({ message: 'Archivo eliminado exitosamente' });
        });
      });
    });
  } catch (error) {
    console.error('Error en deleteFile:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
