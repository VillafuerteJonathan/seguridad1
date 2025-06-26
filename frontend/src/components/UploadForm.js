import React, { useState } from 'react';
import {
  aesEncrypt,
  stringToBytes,
} from '../utils/aes128';

const chunkArray = (arr, size = 16) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const padBlock = (block, size = 16) => {
  const padded = block.slice();
  while (padded.length < size) {
    padded.push(0);
  }
  return padded;
};

const bytesToBase64 = (bytes) => {
  const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), '');
  return btoa(binary);
};

const encryptData = (dataBytes, key) => {
  const keyBytes = typeof key === 'string' ? stringToBytes(key) : key;
  const blocks = chunkArray(dataBytes, 16);
  let encrypted = [];
  blocks.forEach((block) => {
    const padded = padBlock(block);
    const encryptedBlock = aesEncrypt(padded, keyBytes);
    encrypted = encrypted.concat(encryptedBlock);
  });
  return encrypted;
};

const UploadForm = ({ user }) => {
  const [file, setFile] = useState(null);
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !clave) return alert('Debes seleccionar un archivo y una clave.');

    setLoading(true);

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result;
        const bytes = Array.from(new Uint8Array(arrayBuffer));

        const encryptedBytes = encryptData(bytes, clave);
        const encryptedBase64 = bytesToBase64(encryptedBytes);

        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            content: encryptedBase64,
            user: JSON.stringify(user),
          }),
        });

        const data = await res.json();
        alert(data.message || 'Archivo subido correctamente');
        setFile(null);
        setClave('');
      } catch (error) {
        console.error('Error al subir archivo:', error);
        alert('Error al subir archivo.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-body">
        <h3>Cargar archivo PDF cifrado (AES-128)</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Seleccionar PDF:</label>
            <input
              type="file"
              className="form-control"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Clave de cifrado:</label>
            <input
              type="text"
              className="form-control"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Subiendo...' : 'Cifrar y subir'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadForm;
