import React from 'react';

const AuditLogs = ({ logs }) => (
  <div>
    <h2>Auditoría</h2>
    {/* Implementa aquí tu vista de auditoría */}
    {logs.length === 0 ? (
      <p>No hay registros de auditoría.</p>
    ) : (
      <ul>
        {logs.map((log, idx) => (
          <li key={idx}>{JSON.stringify(log)}</li>
        ))}
      </ul>
    )}
  </div>
);

export default AuditLogs;
