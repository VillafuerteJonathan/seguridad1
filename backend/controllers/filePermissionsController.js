const db = require('../db');

exports.getSharedFiles = async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: 'Falta el ID del usuario' });
  }

  const sql = `
    SELECT f.id, f.filename, f.uploaded_at, u.username AS owner_username
    FROM file_permissions fp
    JOIN files f ON fp.file_id = f.id
    JOIN users u ON f.uploaded_by = u.id
    WHERE fp.user_id = ? AND f.status = 'activo'
    ORDER BY f.uploaded_at DESC
  `;

  try {
    const [results] = await db.query(sql, [userId]);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener archivos compartidos:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
