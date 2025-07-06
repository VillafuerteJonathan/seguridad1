const db = require('../db');

exports.uploadFile = async (req, res) => {
  try {
    const { user, filename, content } = req.body;
    if (!user || !filename || !content) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    const userObj = typeof user === 'string' ? JSON.parse(user) : user;
    if (!userObj || !userObj.id) {
      return res.status(400).json({ message: 'Usuario inválido' });
    }

    const ext = '.' + filename.split('.').pop();

    const insertFileSQL = `
      INSERT INTO files (filename, encrypted_content, uploaded_by, original_extension, uploaded_at, access_level, status)
      VALUES (?, ?, ?, ?, NOW(), 'privado', 'activo')
    `;
    const [result] = await db.query(insertFileSQL, [filename, content, userObj.id, ext]);

    const logSQL = `
      INSERT INTO audit_logs (user_id, file_id, action, description, ip_address, timestamp)
      VALUES (?, ?, 'upload', ?, ?, NOW())
    `;
    const logValues = [
      userObj.id,
      result.insertId,
      `El usuario subió el archivo ${filename}`,
      req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
    ];
    try {
      await db.query(logSQL, logValues);
    } catch (logErr) {
      console.error('Error al registrar auditoría:', logErr);
    }

    return res.json({ message: 'Archivo subido exitosamente', fileId: result.insertId });
  } catch (error) {
    console.error('Error en uploadFile:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.getUserFiles = async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: "Falta el ID del usuario" });

  try {
    const [results] = await db.query(`
      SELECT id, filename, uploaded_at, access_level, original_extension, status, encrypted_content
      FROM files
      WHERE uploaded_by = ? AND status = 'activo'
      ORDER BY uploaded_at DESC
    `, [userId]);

    res.json(results);
  } catch (err) {
    console.error('Error al obtener archivos:', err);
    res.status(500).json({ message: "Error al obtener archivos" });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { userId, fileId } = req.body;
    if (!userId || !fileId) {
      return res.status(400).json({ message: 'Faltan datos obligatorios: userId o fileId' });
    }

    const [checkResults] = await db.query(
      `SELECT filename, uploaded_by FROM files WHERE id = ? AND status = 'activo'`,
      [fileId]
    );

    if (checkResults.length === 0) {
      return res.status(404).json({ message: 'Archivo no encontrado o ya eliminado' });
    }

    const file = checkResults[0];
    if (Number(file.uploaded_by) !== Number(userId)) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este archivo' });
    }

    await db.query(`UPDATE files SET status = 'eliminado' WHERE id = ?`, [fileId]);

    const logSQL = `
      INSERT INTO audit_logs (user_id, file_id, action, description, ip_address, timestamp)
      VALUES (?, ?, 'delete', ?, ?, NOW())
    `;
    const logValues = [
      Number(userId),
      Number(fileId),
      `El usuario eliminó el archivo ${file.filename}`,
      req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
    ];

    try {
      await db.query(logSQL, logValues);
    } catch (logErr) {
      console.error('Error al registrar auditoría:', logErr);
    }

    return res.json({ message: 'Archivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteFile:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.compartirArchivo = async (req, res) => {
  const { fileId, userIdOrigen, userIdDestino, permission } = req.body;
  if (!fileId || !userIdOrigen || !userIdDestino) {
    return res.status(400).json({ message: 'Faltan datos para compartir' });
  }

  const permisosValidos = ['read', 'download', 'owner'];
  const permisoFinal = permisosValidos.includes(permission) ? permission : 'read';

  try {
    const [result] = await db.query(
      `SELECT id FROM files WHERE id = ? AND uploaded_by = ?`,
      [fileId, userIdOrigen]
    );
    if (result.length === 0) {
      return res.status(403).json({ message: 'Archivo no válido o sin permisos' });
    }

    await db.query(
      `INSERT INTO file_permissions (file_id, user_id, permission) VALUES (?, ?, ?)`,
      [fileId, userIdDestino, permisoFinal]
    );

    res.json({ message: 'Archivo compartido exitosamente' });
  } catch (error) {
    console.error('Error al compartir archivo:', error);
    res.status(500).json({ message: 'Error al compartir archivo' });
  }
};

exports.getFileContent = async (req, res) => {
  const fileId = req.query.fileId;
  if (!fileId) return res.status(400).json({ message: 'Falta fileId' });

  try {
    const [results] = await db.query(
      `SELECT encrypted_content FROM files WHERE id = ? AND status = 'activo'`,
      [fileId]
    );

    if (results.length === 0) return res.status(404).json({ message: 'Archivo no encontrado' });

    res.json(results[0]);
  } catch (err) {
    console.error('Error al consultar contenido:', err);
    res.status(500).json({ message: 'Error al consultar contenido' });
  }
};

exports.updateAccessLevel = async (req, res) => {
  const { fileId, accessLevel } = req.body;

  if (!fileId || !['privado', 'compartido', 'público'].includes(accessLevel)) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  try {
    await db.query(
      'UPDATE files SET access_level = ? WHERE id = ?',
      [accessLevel, fileId]
    );
    res.json({ message: 'Nivel de acceso actualizado' });
  } catch (err) {
    console.error('Error al actualizar access_level:', err);
    res.status(500).json({ message: 'Error al actualizar nivel de acceso' });
  }
};

