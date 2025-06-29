const db = require('../db');

exports.authorizeFileAccess = (req, res, next) => {
  const fileId = req.params.id ? parseInt(req.params.id, 10) : parseInt(req.body.fileId, 10);
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : parseInt(req.body.userId, 10);

  if (!userId) {
    return res.status(400).json({ message: 'Falta userId para verificar permisos' });
  }

  const sql = `
    SELECT f.uploaded_by, p.permission
      FROM files f
      LEFT JOIN file_permissions p
        ON p.file_id = f.id AND p.user_id = ?
     WHERE f.id = ?
  `;
  db.query(sql, [userId, fileId], (err, results) => {
    if (err) {
      console.error('Error al verificar permisos:', err);
      return res.status(500).json({ message: 'Error al verificar permisos' });
    }
    if (!results.length) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    const { uploaded_by, permission } = results[0];
    if (uploaded_by !== userId && !['read', 'owner'].includes(permission)) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este archivo' });
    }
    next();
  });
};
