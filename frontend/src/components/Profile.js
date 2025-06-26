import React from 'react';

const Profile = ({ user }) => {
  if (!user) return <div>Cargando perfil...</div>;
  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-body">
        <h2 className="card-title mb-4">👤 Perfil del Usuario</h2>
        <p>
          <strong>Nombre de usuario:</strong> {user.username}
        </p>
        {user.email && (
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        )}
        {user.role && (
          <p>
            <strong>Rol:</strong> {user.role}
          </p>
        )}
      </div>
    </div>
  );
};

export default Profile;
