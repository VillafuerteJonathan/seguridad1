import React, { useEffect, useState } from 'react';

const AuditLogs = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#555' }}>No hay registros de auditoría para mostrar.</p>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#222', marginBottom: '20px' }}>Registros de Auditoría</h2>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' 
      }}>
        <thead>
          <tr style={{ backgroundColor: '#004080', color: 'white' }}>
            <th style={{ padding: '12px', border: '1px solid #ccc' }}>ID</th>
            <th style={{ padding: '12px', border: '1px solid #ccc' }}>Archivo ID</th>
            <th style={{ padding: '12px', border: '1px solid #ccc' }}>Acción</th>
            <th style={{ padding: '12px', border: '1px solid #ccc' }}>Fecha y Hora</th>
            <th style={{ padding: '12px', border: '1px solid #ccc' }}>Dirección IP</th>
            <th style={{ padding: '12px', border: '1px solid #ccc' }}>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(({ id, file_id, action, timestamp, ip_address, description }) => (
            <tr key={id} style={{ backgroundColor: id % 2 === 0 ? '#f9f9f9' : 'white' }}>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{id}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{file_id}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textTransform: 'capitalize', color: action === 'delete' ? '#d9534f' : '#5cb85c' }}>
                {action}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{new Date(timestamp).toLocaleString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontFamily: 'monospace', color: '#555' }}>{ip_address}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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

        const res = await fetch(`http://localhost:5000/api/audit-logs?userId=${currentUser.id}`);

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

  return <AuditLogs logs={logs} />;
};

export default AuditLogsContainer;
