const db = require('../db');

exports.getSharedFiles = async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: 'Falta el ID del usuario' });
  }

  const sql = `
    SELECT f.id, f.filename, f.uploaded_at, f.uploaded_by, u.username AS owner_username, fp.permission
    FROM file_permissions fp
    JOIN files f ON fp.file_id = f.id
    JOIN users u ON f.uploaded_by = u.id
    WHERE fp.user_id = ? AND f.status = 'activo'
    ORDER BY f.uploaded_at DESC
  `;

  try {
    const [results] = await db.query(sql, [userId]);
    /*
    await db.query(
      `INSERT INTO audit_logs (user_id, action, description, ip_address, timestamp)
      VALUES (?, 'view', ?, ?, NOW())`,
      [
        Number(userId),
        'El usuario visualizó los archivos compartidos con él',
        req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
      ]
    );*/
    res.json(results);
  } catch (err) {
    console.error('Error al obtener archivos compartidos:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getPermissionsByFile = async (req, res) => {
  const fileId = req.query.fileId;

  if (!fileId) {
    return res.status(400).json({ message: 'Falta el ID del archivo' });
  }

  const sql = `
    SELECT fp.id, fp.user_id, u.username, fp.permission
    FROM file_permissions fp
    JOIN users u ON fp.user_id = u.id
    WHERE fp.file_id = ?
  `;

  try {
    const [results] = await db.query(sql, [fileId]);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener permisos del archivo:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.revokePermission = async (req, res) => {
  const { fileId, userId } = req.body;

  if (!fileId || !userId) {
    return res.status(400).json({ message: 'Faltan datos para revocar permiso' });
  }

  try {
    await db.query(
      `DELETE FROM file_permissions WHERE file_id = ? AND user_id = ?`,
      [fileId, userId]
    );

    const adminId = req.body.adminId || null;
    if (adminId) {
      await db.query(
        `INSERT INTO audit_logs (user_id, file_id, action, description, ip_address, timestamp)
         VALUES (?, ?, 'delete', ?, ?, NOW())`,
        [
          Number(adminId),
          Number(fileId),
          `El usuario ${adminId} revocó acceso al archivo ${fileId} para el usuario ${userId}`,
          req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
        ]
      );
    }

    res.json({ message: 'Permiso revocado correctamente' });
  } catch (err) {
    console.error('Error al revocar permiso:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.updatePermission = async (req, res) => {
  const { fileId, userId, permission, adminId } = req.body;

  if (!fileId || !userId || !permission || !adminId) {
    return res.status(400).json({ message: 'Faltan datos para actualizar permiso' });
  }

  const validPermissions = ['read', 'download', 'owner'];
  if (!validPermissions.includes(permission)) {
    return res.status(400).json({ message: 'Permiso inválido' });
  }

  try {
    await db.query(
      `UPDATE file_permissions SET permission = ? WHERE file_id = ? AND user_id = ?`,
      [permission, fileId, userId]
    );

    await db.query(
      `INSERT INTO audit_logs (user_id, file_id, action, description, ip_address, timestamp)
       VALUES (?, ?, 'change_permission', ?, ?, NOW())`,
      [
        Number(adminId),
        Number(fileId),
        `El usuario actualizó el permiso del usuario ${userId} a "${permission}"`,
        req.ip || req.headers['x-forwarded-for'] || 'IP no disponible',
      ]
    );

    res.json({ message: 'Permiso actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar permiso:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getPublicFiles = async (req, res) => {
  const sql = `
    SELECT f.id, f.filename, f.uploaded_at, u.username AS owner_username
    FROM files f
    JOIN users u ON f.uploaded_by = u.id
    WHERE f.access_level = 'público' AND f.status = 'activo'
    ORDER BY f.uploaded_at DESC
  `;

  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener archivos públicos:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};


