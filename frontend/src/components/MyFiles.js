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
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioDestino, setUsuarioDestino] = useState('');
  const [archivoACompartir, setArchivoACompartir] = useState(null);
  const [permisosExistentes, setPermisosExistentes] = useState([]);
  const [tipoPermiso, setTipoPermiso] = useState('read'); 
  const [accessLevel, setAccessLevel] = useState('privado');
  const mostrarSeccionCompartir = accessLevel === 'compartido';
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [accionesPendientes, setAccionesPendientes] = useState([]);
  const [permisosTemporales, setPermisosTemporales] = useState([]);

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

useEffect(() => {
  const modalElement = document.getElementById('modalCompartir');
  const bsModal = modalElement ? new window.bootstrap.Modal(modalElement) : null;

  if (modalElement) {
    modalElement.addEventListener('hidden.bs.modal', resetModal);
  }

  return () => {
    if (modalElement) {
      modalElement.removeEventListener('hidden.bs.modal', resetModal);
    }
  };
}, []);



useEffect(() => {
  if (usuarios.length && permisosTemporales.length >= 0) {
    setUsuariosDisponibles(filtrarUsuariosDisponibles(usuarios, permisosTemporales));
  }
}, [usuarios, permisosTemporales]);



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

  const filtrarUsuariosDisponibles = (todos, permisos) => {
  const idsConPermiso = permisos.map(p => p.user_id);
  return todos.filter(u => u.id !== currentUser.id && !idsConPermiso.includes(u.id));
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

const handleAbrirCompartir = async (file) => {
  setAccessLevel(file.access_level || 'privado');
  setArchivoACompartir(file);
  setUsuarioDestino('');
  setTipoPermiso('read');

  try {
    const [usuariosRes, permisosRes] = await Promise.all([
      fetch('http://localhost:5000/api/users'),
      fetch(`http://localhost:5000/api/file-permissions?fileId=${file.id}`)
    ]);

    const todosLosUsuarios = await usuariosRes.json();
    const permisos = await permisosRes.json();

    setPermisosExistentes(permisos); // estado original
    setPermisosTemporales(permisos); // copia provisional
    setAccionesPendientes([]); // acciones por aplicar

    const idsCompartidos = permisos.map(p => p.user_id);
    setUsuarios(todosLosUsuarios.filter(u => u.id !== currentUser.id && !idsCompartidos.includes(u.id)));

    const modal = new window.bootstrap.Modal(document.getElementById('modalCompartir'));
    modal.show();
  } catch (err) {
    console.error('Error al cargar usuarios o permisos:', err);
  }
};

const handleRevocar = (userId) => {
  setPermisosTemporales(prev => prev.filter(p => p.user_id !== userId));

  const usuarioRevocado = usuarios.find(u => u.id === userId);
  if (usuarioRevocado) {
    setUsuariosDisponibles(prev => [...prev, usuarioRevocado]);
  }

  setAccionesPendientes(prev => {
    const eraNuevo = prev.find(a => a.userId === userId && a.tipo === 'nuevo');
    if (eraNuevo) {
      return prev.filter(a => a.userId !== userId);
    }
    return [...prev, { tipo: 'revocar', userId }];
  });
};

const resetModal = () => {
  setArchivoACompartir(null);
  setAccessLevel('privado');
  setUsuarioDestino('');
  setTipoPermiso('read');
  setPermisosTemporales([]);
  setPermisosExistentes([]);
  setAccionesPendientes([]);
};


const handleActualizarPermiso = (userId, newPerm) => {
  setPermisosTemporales(prev =>
    prev.map(p => p.user_id === userId ? { ...p, permission: newPerm } : p)
  );

  setAccionesPendientes(prev => {
    const yaExiste = prev.find(a => a.userId === userId);
    if (yaExiste && yaExiste.tipo === 'nuevo') {
      // ya estaba marcado como nuevo
      return prev.map(a => a.userId === userId ? { ...a, permission: newPerm } : a);
    }

    // actualizar o crear acción de actualización
    const otros = prev.filter(a => a.userId !== userId || a.tipo === 'revocar');
    return [...otros, { tipo: 'actualizar', userId, permission: newPerm }];
  });
};


const handleGuardarAccessLevel = async () => {
  try {
    // 1. Actualizar nivel de acceso
    const res = await fetch('http://localhost:5000/api/file-access', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: archivoACompartir.id, accessLevel }),
    });

    if (!res.ok) return alert('Error al actualizar nivel de acceso');

    // 2. Si se vuelve privado o público, eliminar permisos
    if (accessLevel === 'privado' || accessLevel === 'público') {
      for (const p of permisosTemporales) {
        await fetch('http://localhost:5000/api/file-permission', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: archivoACompartir.id, userId: p.user_id }),
        });
      }
      setPermisosExistentes([]);
    } else {
      // 3. Ejecutar acciones pendientes
      for (const a of accionesPendientes) {
        if (a.tipo === 'nuevo') {
          await fetch('http://localhost:5000/api/share-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId: archivoACompartir.id,
              userIdOrigen: currentUser.id,
              userIdDestino: a.userId,
              permission: a.permission
            })
          });
        } else if (a.tipo === 'actualizar') {
          await fetch('http://localhost:5000/api/file-permission', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: archivoACompartir.id, userId: a.userId, permission: a.permission })
          });
        } else if (a.tipo === 'revocar') {
          await fetch('http://localhost:5000/api/file-permission', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: archivoACompartir.id, userId: a.userId })
          });
        }
      }

      setPermisosExistentes(permisosTemporales);
    }

    alert('Cambios guardados exitosamente');
    const modal = window.bootstrap.Modal.getInstance(document.getElementById('modalCompartir'));
    if (modal) modal.hide();

  } catch (err) {
    console.error('Error al guardar:', err);
    alert('Error al guardar los cambios');
  }
};


const handleCompartir = () => {
  if (!usuarioDestino) return alert('Selecciona un usuario');

  const nuevo = usuarios.find(u => u.id === parseInt(usuarioDestino));
  if (!nuevo) return;
  setPermisosTemporales(prev => [
    ...prev,
    { user_id: nuevo.id, username: nuevo.username, permission: tipoPermiso }
  ]);
  setAccionesPendientes(prev => [
    ...prev,
    { tipo: 'nuevo', userId: nuevo.id, permission: tipoPermiso }
  ]);
  setUsuariosDisponibles(prev => prev.filter(u => u.id !== nuevo.id));
  setUsuarioDestino('');
  setTipoPermiso('read');
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
              <th>Nivel de Acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {archivos.map((file) => (
              <tr key={file.id}>
                <td>{file.filename}</td>
                <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                <td>{file.access_level}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-primary me-2" 
                    onClick={() => abrirModal(file)}
                  >
                    🔓 Descifrar
                  </button>

                  <button
                   className="btn btn-sm btn-warning me-2" onClick={() => handleAbrirCompartir(file)}>
                      🔗 Compartir
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleEliminar(file.id)}
                      disabled={deletingFileId === file.id}
                    >
                      🗑️ {deletingFileId === file.id ? 'Eliminando...' : 'Eliminar'}
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

      {/* Modal para compartir */}
      <div
        className="modal fade"
        id="modalCompartir"
        tabIndex="-1"
        aria-labelledby="modalCompartirLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalCompartirLabel">
                Compartir archivo: {archivoACompartir?.filename}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nivel de compartición:</label>
                  <select
                    className="form-select"
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value)} // solo actualiza el estado local
                  >
                    <option value="privado">🔒 Privado</option>
                    <option value="compartido">👥 Compartido</option>
                    <option value="público">🌐 Público</option>
                  </select>
                </div>

                {mostrarSeccionCompartir && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Usuario destinatario:</label>
                      <select className="form-select" onChange={e => setUsuarioDestino(e.target.value)} value={usuarioDestino}>
                        <option value="">Selecciona usuario</option>
                        {usuariosDisponibles.map((u) => (
                          <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                      </select>

                    </div>

                    <div className="mb-3">
                      <label className="form-label">Tipo de permiso:</label>
                      <select
                        className="form-select"
                        onChange={e => setTipoPermiso(e.target.value)}
                        value={tipoPermiso}
                      >
                        <option value="read">🔒 Solo visualizar</option>
                        <option value="download">⬇️ Visualizar y descargar</option>
                        <option value="owner">📤 Descargar y gestionar acceso</option>
                      </select>
                    </div>

                    <div className="d-grid gap-2">
                      <button onClick={handleCompartir} className="btn btn-success">
                        ➕ Compartir con usuario
                      </button>
                    </div>



                    {permisosTemporales.length > 0 && (
                      <div className="mt-4">
                        <h6>Usuarios con acceso:</h6>
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Usuario</th>
                              <th>Permiso</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {permisosTemporales.map((p) => (
                              <tr key={p.user_id}>
                                <td>{p.username}</td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={p.permission}
                                    onChange={(e) => handleActualizarPermiso(p.user_id, e.target.value)}
                                  >
                                    <option value="read">🔒 Solo visualizar</option>
                                    <option value="download">⬇️ Visualizar y descargar</option>
                                    <option value="owner">📤 Descargar y gestionar acceso</option>
                                  </select>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRevocar(p.user_id)}
                                  >
                                    ❌
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </>
                )}
              </div>

            <div className="modal-footer">
              <button onClick={() => handleGuardarAccessLevel()} className="btn btn-primary">
                Aceptar
              </button>
              <button className="btn btn-secondary" data-bs-dismiss="modal" onClick={resetModal}>
                Cancelar
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyFiles;