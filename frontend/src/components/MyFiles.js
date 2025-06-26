import React, { useState, useEffect, useRef } from 'react';
import { aesDecrypt, stringToBytes } from '../utils/aes128';

// Helpers
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

const MyFiles = () => {
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [claveDescifrado, setClaveDescifrado] = useState('');
  const [textoDescifrado, setTextoDescifrado] = useState(null);
  const [errorClave, setErrorClave] = useState('');
  const [deletingFileId, setDeletingFileId] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchArchivos = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/user-files?userId=${currentUser.id}`);
        const data = await res.json();
        setArchivos(data);
      } catch (error) {
        console.error('Error al obtener archivos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) fetchArchivos();
  }, [currentUser]);

  const abrirModal = (file) => {
    setArchivoSeleccionado(file);
    setTextoDescifrado(null);
    setClaveDescifrado('');
    setErrorClave('');
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
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
        action: 'Descifrar archivo',
        description: `Usuario ${currentUser.id} descifró archivo ${archivoSeleccionado.id}`
      }),
    });
    } catch (err) {
      console.error(err);
      setErrorClave('❌ Clave incorrecta o error al descifrar');
    }
  };

  const handleEliminar = async (fileId) => {
    if (!window.confirm('¿Estás seguro de eliminar este archivo? Esta acción no se puede deshacer.')) return;

    setDeletingFileId(fileId);
    try {
      const res = await fetch('http://localhost:5000/api/delete-file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, fileId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Archivo eliminado correctamente');
        setArchivos((prev) => prev.filter((file) => file.id !== fileId));
        if (archivoSeleccionado?.id === fileId) {
          setArchivoSeleccionado(null);
          setTextoDescifrado(null);
          setClaveDescifrado('');
          setErrorClave('');
        }
      } else {
        alert(data.message || 'Error al eliminar el archivo');
      }
    } catch (err) {
      console.error('Error al eliminar archivo:', err);
      alert('Error de red o del servidor');
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <div>
      <h3>📄 Mis Archivos</h3>
      {loading ? (
        <p>Cargando archivos...</p>
      ) : archivos.length === 0 ? (
        <p>No tienes archivos aún.</p>
      ) : (
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Nombre</th>
              <th>Subido en</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {archivos.map((file) => (
              <tr key={file.id}>
                <td>{file.filename}</td>
                <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => abrirModal(file)}
                  >
                    🔓 Descifrar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleEliminar(file.id)}
                    disabled={deletingFileId === file.id}
                  >
                    {deletingFileId === file.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
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
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
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

export default MyFiles; 