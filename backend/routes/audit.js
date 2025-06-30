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
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: 'Falta el userId en la consulta' });
  }

  try {
    const sql = 'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100';
    const [results] = await pool.query(sql, [userId]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error al obtener logs de auditoría:', err);
    res.status(500).json({ message: 'Error al obtener registros de auditoría' });
  }
});

module.exports = router;
