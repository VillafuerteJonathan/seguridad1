const express = require('express');
const router = express.Router();
const pool = require('../db'); // mysql2/promise pool

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',').shift().trim() || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
};

async function insertarAuditoria({ userId, fileId, action, ipAddress, description }) {
  const query = `
    INSERT INTO audit_logs (user_id, file_id, action, ip_address, description, timestamp)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  await pool.query(query, [userId, fileId, action, ipAddress, description]);
}

router.post('/log-action', async (req, res) => {
  try {
    const { userId, fileId, action, description } = req.body;

    if (!userId || !fileId || !action || !description) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para auditoría' });
    }

    const ipAddress = getClientIp(req);
    console.log(`[AUDIT] Registro acción: user ${userId}, file ${fileId}, action ${action}, IP ${ipAddress}`);

    await insertarAuditoria({ userId, fileId, action, ipAddress, description });

    res.json({ message: 'Acción registrada en auditoría' });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
    res.status(500).json({ message: 'Error al registrar auditoría' });
  }
});

router.get('/audit-logs', async (req, res) => {
  const { userId, role } = req.query;

  if (!userId || !role) {
    return res.status(400).json({ message: 'Faltan parámetros: userId o role' });
  }

  try {
    let sql;
    let params;

    if (role === 'admin') {
      sql = `
        SELECT a.*, u.username, f.filename
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN files f ON a.file_id = f.id
        ORDER BY a.timestamp DESC
        LIMIT 100
      `;
      params = [];
    } else {
      sql = `
        SELECT a.*, u.username, f.filename
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN files f ON a.file_id = f.id
        WHERE a.user_id = ?
        ORDER BY a.timestamp DESC
        LIMIT 100
      `;
      params = [userId];
    }

    const [results] = await pool.query(sql, params);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error al obtener logs de auditoría:', err);
    res.status(500).json({ message: 'Error al obtener registros de auditoría' });
  }
});



module.exports = router;
