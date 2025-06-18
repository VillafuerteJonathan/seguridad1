// components/FileDownload.js

import React from 'react';
import axios from 'axios';

const FileDownload = ({ fileId }) => {
  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/download/${fileId}`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Envía el token JWT
        },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'archivo_descifrado');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al descargar el archivo:', err);
      alert('Error al descargar el archivo');
    }
  };

  return (
    <div className="file-download">
      <h2>Descargar Archivo</h2>
      <button onClick={handleDownload}>Descargar Archivo</button>
    </div>
  );
};

export default FileDownload;