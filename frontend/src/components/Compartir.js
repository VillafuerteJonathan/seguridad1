// src/components/Compartir.js
import React, { useEffect, useState } from 'react';

const Compartir = ({ archivo, currentUser }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioDestino, setUsuarioDestino] = useState('');
  const [tipoPermiso, setTipoPermiso] = useState('read');
  const [permisosExistentes, setPermisosExistentes] = useState([]);
  const [permisosTemporales, setPermisosTemporales] = useState([]);
  const [accionesPendientes, setAccionesPendientes] = useState([]);

  const modalId = `modalCompartir-${archivo.id}`;

  useEffect(() => {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;

    const handleHide = () => resetModal();
    modalElement.addEventListener('hidden.bs.modal', handleHide);

    return () => {
      modalElement.removeEventListener('hidden.bs.modal', handleHide);
    };
  }, []);

  const resetModal = () => {
    setUsuarios([]);
    setUsuarioDestino('');
    setTipoPermiso('read');
    setPermisosExistentes([]);
    setPermisosTemporales([]);
    setAccionesPendientes([]);
  };

  const abrirModal = async () => {
    try {
      const [usuariosRes, permisosRes] = await Promise.all([
        fetch('http://localhost:5000/api/users'),
        fetch(`http://localhost:5000/api/file-permissions?fileId=${archivo.id}`)
      ]);

      const allUsers = await usuariosRes.json();
      const permisos = await permisosRes.json();

      setPermisosExistentes(permisos);
      setPermisosTemporales(permisos);
      setAccionesPendientes([]);

      // ⚠️ Filtrar: ni currentUser ni el dueño deben estar en el select
      const idsRestringidos = [archivo.uploaded_by, currentUser.id, ...permisos.map(p => p.user_id)];
      const filtrados = allUsers.filter(u => !idsRestringidos.includes(u.id));
      setUsuarios(filtrados);

      const modal = new window.bootstrap.Modal(document.getElementById(modalId));
      modal.show();
    } catch (err) {
      console.error('Error al abrir modal de compartir:', err);
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

    setUsuarios(prev => prev.filter(u => u.id !== nuevo.id));
    setUsuarioDestino('');
    setTipoPermiso('read');
  };

  const handleGuardarCambios = async () => {
    try {
      for (const a of accionesPendientes) {
        if (a.tipo === 'nuevo') {
          await fetch('http://localhost:5000/api/share-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId: archivo.id,
              userIdOrigen: archivo.uploaded_by,
              userIdDestino: a.userId,
              permission: a.permission,
            })
          });
        }
      }

      alert('Cambios aplicados');
      const modal = window.bootstrap.Modal.getInstance(document.getElementById(modalId));
      if (modal) modal.hide();
    } catch (err) {
      console.error('Error al aplicar cambios:', err);
      alert('Ocurrió un error al aplicar los cambios');
    }
  };

  return (
    <>
      <button
        className="btn btn-sm btn-warning ms-2"
        onClick={abrirModal}
      >
        🔗 Compartir
      </button>

      <div className="modal fade" id={modalId} tabIndex="-1" aria-labelledby={`${modalId}-label`} aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id={`${modalId}-label`}>
                Compartir archivo: {archivo.filename}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div className="modal-body">
              <p><strong>Dueño del archivo:</strong> {archivo.owner_username}</p>

              <div className="mb-3">
                <label className="form-label">Usuario destinatario:</label>
                <select className="form-select" onChange={e => setUsuarioDestino(e.target.value)} value={usuarioDestino}>
                  <option value="">Selecciona usuario</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Tipo de permiso:</label>
                <select className="form-select" onChange={e => setTipoPermiso(e.target.value)} value={tipoPermiso}>
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
                      </tr>
                    </thead>
                    <tbody>
                      {permisosTemporales
                        .filter(p => p.user_id !== currentUser.id && p.user_id !== archivo.uploaded_by)
                        .map(p => (
                          <tr key={p.user_id}>
                            <td>{p.username}</td>
                            <td>{
                              p.permission === 'read' ? 'Solo visualizar' :
                              p.permission === 'download' ? 'Visualizar y descargar' :
                              'Descargar y gestionar acceso'
                            }</td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleGuardarCambios}>Aceptar</button>
              <button className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Compartir;
