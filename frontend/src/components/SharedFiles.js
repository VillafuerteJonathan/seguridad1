import React, { useEffect, useState, useRef } from 'react';
import { aesDecrypt, stringToBytes } from '../utils/aes128';

const chunkArray = (arr, size = 16) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const base64ToBytes = (base64) => {
  const binary = atob(base64);
  const bytes = [];
  for (let i = 0; i < binary.length; i++) {
    bytes.push(binary.charCodeAt(i));
  }
  return bytes;
};

const removePaddingZeros = (bytes) => {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) {
    end--;
  }
  return bytes.slice(0, end);
};

const decryptData = (encryptedBytes, key) => {
  const keyBytes = typeof key === 'string' ? stringToBytes(key) : key;
  const blocks = chunkArray(encryptedBytes, 16);
  let decrypted = [];
  blocks.forEach((block) => {
    const decryptedBlock = aesDecrypt(block, keyBytes);
    decrypted = decrypted.concat(decryptedBlock);
  });
  return decrypted;
};

const SharedFiles = () => {
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [claveDescifrado, setClaveDescifrado] = useState('');
  const [textoDescifrado, setTextoDescifrado] = useState(null);
  const [errorClave, setErrorClave] = useState('');
  const modalRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchCompartidos = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/shared-files?userId=${currentUser.id}`);
        const data = await res.json();
        setArchivos(data);
      } catch (err) {
        console.error('Error al cargar archivos compartidos:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) fetchCompartidos();
  }, [currentUser]);

  const abrirModal = async (file) => {
    try {
      const res = await fetch(`http://localhost:5000/api/file-content?fileId=${file.id}`);
      const data = await res.json();
      if (res.ok && data.encrypted_content) {
        setArchivoSeleccionado({ ...file, encrypted_content: data.encrypted_content });
        setClaveDescifrado('');
        setTextoDescifrado(null);
        setErrorClave('');
        const modal = new window.bootstrap.Modal(modalRef.current);
        modal.show();
      } else {
        alert('No se pudo obtener el contenido cifrado');
      }
    } catch (err) {
      console.error('Error al obtener contenido cifrado:', err);
    }
  };

  const handleDescifrar = () => {
    setErrorClave('');
    setTextoDescifrado(null);

    try {
      const encryptedBytes = base64ToBytes(archivoSeleccionado.encrypted_content);
      const decryptedBytes = decryptData(encryptedBytes, claveDescifrado);
      const cleanBytes = removePaddingZeros(decryptedBytes);

      const blob = new Blob([new Uint8Array(cleanBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setTextoDescifrado(url);

      fetch('http://localhost:5000/api/log-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          fileId: archivoSeleccionado.id,
          action: 'Descifrar archivo compartido',
          description: `Usuario ${currentUser.id} descifró un archivo compartido (${archivoSeleccionado.id})`
        }),
      });
    } catch (err) {
      console.error(err);
      setErrorClave('❌ Clave incorrecta o error al descifrar');
    }
  };

  return (
    <div>
      <h3>🔗 Archivos Compartidos Contigo</h3>
      {loading ? (
        <p>Cargando archivos compartidos...</p>
      ) : archivos.length === 0 ? (
        <p>No hay archivos compartidos contigo aún.</p>
      ) : (
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Nombre</th>
              <th>Compartido por</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {archivos.map((file) => (
              <tr key={file.id}>
                <td>{file.filename}</td>
                <td>{file.owner_username}</td>
                <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => abrirModal(file)}
                  >
                    🔓 Descifrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de descifrado */}
      <div
        className="modal fade"
        ref={modalRef}
        tabIndex="-1"
        aria-labelledby="modalClaveLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalClaveLabel">
                🔐 Clave para descifrar: {archivoSeleccionado?.filename}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <input
                type="password"
                className="form-control"
                value={claveDescifrado}
                onChange={(e) => setClaveDescifrado(e.target.value)}
                placeholder="Ingresa la clave de descifrado"
              />
              <button className="btn btn-success mt-3" onClick={handleDescifrar}>
                Ver PDF descifrado
              </button>
              {errorClave && <p className="text-danger mt-2">{errorClave}</p>}
              {textoDescifrado && (
                <div className="mt-4">
                  <strong>📄 PDF Descifrado:</strong>
                  <iframe
                    src={textoDescifrado}
                    title="Archivo Descifrado"
                    width="100%"
                    height="600px"
                    style={{ border: '1px solid #ccc' }}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedFiles;
