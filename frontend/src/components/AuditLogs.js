import React, { useEffect, useState } from 'react';




const AuditLogs = ({ logs, role }) => {
  const [usuarioFiltro, setUsuarioFiltro] = useState('');

  const logsFiltrados = role === 'admin' && usuarioFiltro
  ? logs.filter(log => log.username === usuarioFiltro)
  : logs;
  if (!logs || logs.length === 0) {
    return <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#555' }}>No hay registros de auditoría para mostrar.</p>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#222', marginBottom: '20px' }}>Registros de Auditoría</h2>
      {role === 'admin' && (
        <div className="mb-3 d-flex justify-content-end align-items-center">
          <label className="form-label me-2 mb-0">Filtrar por usuario:</label>
          <select
            className="form-select w-auto"
            value={usuarioFiltro}
            onChange={(e) => setUsuarioFiltro(e.target.value)}
          >
            <option value="">Todos</option>
            {[...new Set(logs.map(log => log.username))].map((user, idx) => (
              <option key={idx} value={user}>{user}</option>
            ))}
          </select>
        </div>
      )}

      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' 
      }}>
        <thead>
          <tr style={{ backgroundColor: '#004080', color: 'white' }}>
            <th style={thStyle}>ID</th>
            {role === 'admin' && <th style={thStyle}>Usuario</th>}
            <th style={thStyle}>Archivo</th>
            <th style={thStyle}>Acción</th>
            <th style={thStyle}>Fecha y Hora</th>
            <th style={thStyle}>Dirección IP</th>
            <th style={thStyle}>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {logsFiltrados.map(({ id, username, filename, action, timestamp, ip_address, description }) => (
            <tr key={id} style={{ backgroundColor: id % 2 === 0 ? '#f9f9f9' : 'white' }}>
              <td style={tdStyle}>{id}</td>
              {role === 'admin' && <td style={tdStyle}>{username}</td>}
              <td style={tdStyle}>{filename || '-'}</td>
              <td style={{ ...tdStyle, textTransform: 'capitalize', color: action === 'delete' ? '#d9534f' : '#5cb85c' }}>
                {action}
              </td>
              <td style={tdStyle}>{new Date(timestamp).toLocaleString()}</td>
              <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#555' }}>{ip_address}</td>
              <td style={tdStyle}>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = { padding: '12px', border: '1px solid #ccc' };
const tdStyle = { padding: '10px', border: '1px solid #ddd', textAlign: 'center' };

const AuditLogsContainer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const currentUser = JSON.parse(localStorage.getItem('user'));

        if (!currentUser?.id) {
          throw new Error('Usuario no autenticado');
        }

        const res = await fetch(`http://localhost:5000/api/audit-logs?userId=${currentUser.id}&role=${currentUser.role}`);

        if (!res.ok) {
          throw new Error(`Error al obtener registros de auditoría: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        setLogs(data);
      } catch (err) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) return <p style={{ textAlign: 'center' }}>Cargando registros de auditoría...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>;

  const currentUser = JSON.parse(localStorage.getItem('user'));
  return <AuditLogs logs={logs} role={currentUser?.role} />;
};

export default AuditLogsContainer;
