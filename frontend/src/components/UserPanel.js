import React, { useEffect, useState, useRef } from 'react';

const UserPanel = () => {
  const [users, setUsers] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error al obtener usuarios:', err));
  }, []);

  const abrirModal = (user, role) => {
    setUsuarioSeleccionado(user);
    setNuevoRol(role);
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
  };

  const handleConfirmarCambio = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!usuarioSeleccionado || !nuevoRol) return;
    try {
      const res = await fetch('http://localhost:5000/auth/update-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: usuarioSeleccionado.id, newRole: nuevoRol,adminId: currentUser?.id }),
      });

      if (res.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === usuarioSeleccionado.id ? { ...u, role: nuevoRol } : u
          )
        );
        alert('Rol actualizado correctamente');
      } else {
        alert('Error al actualizar el rol');
      }
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      alert('Error de red o del servidor');
    } finally {
      const modal = window.bootstrap.Modal.getInstance(modalRef.current);
      if (modal) modal.hide();
      setUsuarioSeleccionado(null);
      setNuevoRol('');
    }
  };
  const toggleAcceso = async (user) => {
    const nuevoEstado = user.can_login ? 0 : 1;
    const currentUser = JSON.parse(localStorage.getItem('user'));

    try {
      const res = await fetch('http://localhost:5000/auth/update-login-permission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          canLogin: nuevoEstado,
          adminId: currentUser?.id,
        }),
      });

      if (res.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === user.id ? { ...u, can_login: nuevoEstado } : u
          )
        );
        alert(`Acceso ${nuevoEstado ? 'habilitado' : 'deshabilitado'} para ${user.username}`);
      } else {
        alert('Error al actualizar acceso');
      }
    } catch (err) {
      console.error('Error al actualizar acceso:', err);
      alert('Error de red o del servidor');
    }
  };


  return (
    <div>
      <h3>👮 Panel de Usuarios</h3>
      {users.length === 0 ? (
        <p>No hay usuarios registrados.</p>
      ) : (
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acceso</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={u.role}
                    onChange={(e) => abrirModal(u, e.target.value)}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${u.can_login ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => toggleAcceso(u)}
                  >
                    {u.can_login ? '✅ Habilitado' : '🚫 Deshabilitado'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de Confirmación */}
      <div
        className="modal fade"
        ref={modalRef}
        tabIndex="-1"
        aria-labelledby="confirmModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="confirmModalLabel">Confirmar cambio de rol</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Cerrar"
              ></button>
            </div>
            <div className="modal-body">
              ¿Estás seguro que deseas cambiar el rol de <strong>{usuarioSeleccionado?.username}</strong> a <strong>{nuevoRol === 'admin' ? 'Administrador' : 'Usuario'}</strong>?
            </div>
            <div className="modal-footer">
              <button onClick={handleConfirmarCambio} className="btn btn-primary">Sí, cambiar</button>
              <button className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
