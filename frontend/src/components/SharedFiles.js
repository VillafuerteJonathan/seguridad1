import React, { useEffect, useState, useRef } from 'react';
import { aesDecrypt, stringToBytes } from '../utils/aes128';
import Compartir from './Compartir'; 


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
  const [archivosPublicos, setArchivosPublicos] = useState([]);
  const [mensajeFirma, setMensajeFirma] = useState('');


  useEffect(() => {
  const fetchCompartidos = async () => {
    try {
      const [sharedRes, publicRes] = await Promise.all([
        fetch(`http://localhost:5000/api/shared-files?userId=${currentUser.id}`),
        fetch(`http://localhost:5000/api/public-files`)
      ]);

      const sharedData = await sharedRes.json();
      const publicData = await publicRes.json();

      setArchivos(sharedData);
      setArchivosPublicos(publicData);
    } catch (err) {
      console.error('Error al cargar archivos compartidos o públicos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser?.id) fetchCompartidos();
}, [currentUser]);


const abrirModal = async (file) => {
  const currentUser = JSON.parse(localStorage.getItem('user')); 
  const userId = currentUser?.id;

  try {
    const res = await fetch(`http://localhost:5000/api/file-content?fileId=${file.id}&userId=${userId}`);
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
  const traducirPermiso = (perm) => {
    switch (perm) {
      case 'read':
        return '🔒 Solo visualizar';
      case 'download':
        return '⬇️ Visualizar y descargar';
      case 'owner':
        return '📤 Descargar y gestionar acceso';
      default:
        return perm;
    }
  };

const verificarFirma = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/verify-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: archivoSeleccionado.id }),
    });

    const data = await res.json();
    return data.valid;
  } catch (err) {
    console.error('Error al verificar firma:', err);
    return false;
  }
};

const handleDescifrar = async () => {
  setErrorClave('');
  setTextoDescifrado(null);
  setMensajeFirma('');

  const firmaValida = await verificarFirma();
  if (!firmaValida) {
    setErrorClave('⚠️ Firma digital inválida: El archivo puede haber sido alterado.');
    return;
  } else {
    setMensajeFirma('✅ Firma digital válida: El archivo no ha sido alterado.');
  }

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
        action: 'decrypt',
        description: `Usuario ${currentUser.id} descifró el archivo compartido ${archivoSeleccionado.id}`
      }),
    });
  } catch (err) {
    console.error(err);
    setErrorClave('❌ Clave incorrecta o error al descifrar');
  }
};

  return (
    <div>
      <h3>🔗 Archivos Compartidos Conmigo</h3>
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
              <th>Permiso</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {archivos.map((file) => (
              <tr key={file.id}>
                <td>{file.filename}</td>
                <td>{file.owner_username}</td>
                <td>{traducirPermiso(file.permission)}</td>
                <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => abrirModal(file)}
                    >
                      🔓 Descifrar
                    </button>
                    {file.permission === 'owner' && (
                      <Compartir archivo={file} currentUser={currentUser} />
                    )}


                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {archivosPublicos.length > 0 && (
        <>
          <h4 className="mt-5">🌍 Archivos Públicos</h4>
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
              {archivosPublicos.map((file) => (
                <tr key={`pub-${file.id}`}>
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
        </>
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
              {mensajeFirma && <div className="alert alert-success mt-3">{mensajeFirma}</div>}
              {errorClave && <div className="alert alert-danger mt-3">{errorClave}</div>}
              {textoDescifrado && (
                  <div className="mt-4">
                    <strong>📄 PDF Descifrado:</strong>

                    {archivoSeleccionado?.permission === 'read' ? (
                      <embed
                        src={`${textoDescifrado}#toolbar=0&navpanes=0&scrollbar=0`}
                        type="application/pdf"
                        width="100%"
                        height="600px"
                        style={{ border: '1px solid #ccc' }}
                      />
                    ) : (
                      <iframe
                        src={textoDescifrado}
                        title="Archivo Descifrado"
                        width="100%"
                        height="600px"
                        style={{ border: '1px solid #ccc' }}
                      />
                    )}

                    {(archivoSeleccionado?.permission === 'download' || archivoSeleccionado?.permission === 'owner') && (
                        <div className="mt-3">
                          <button
                            className="btn btn-outline-success"
                            onClick={() => {
                              fetch('http://localhost:5000/api/log-action', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userId: currentUser.id,
                                  fileId: archivoSeleccionado.id,
                                  action: 'download',
                                  description: `Usuario ${currentUser.id} descargó el archivo ${archivoSeleccionado.id}`
                                }),
                              });

                              const link = document.createElement('a');
                              link.href = textoDescifrado;
                              link.download = archivoSeleccionado.filename || 'archivo.pdf';
                              link.target = '_blank';
                              link.rel = 'noopener noreferrer';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            ⬇️ Descargar PDF
                          </button>
                        </div>
                      )}
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
