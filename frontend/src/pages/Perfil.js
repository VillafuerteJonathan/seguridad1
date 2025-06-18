import React from 'react';
import jwtDecode from 'jwt-decode';
import TwoFASettings from './TwoFASettings';

const Profile = () => {
  // Obtener el token del localStorage
  const token = localStorage.getItem('token');

  // Decodificar el token para obtener la información del usuario
  const decodedToken = jwtDecode(token);
  const userEmail = decodedToken.email;
  const username = decodedToken.username; // Si el token incluye el nombre de usuario

  return (
    <div className="profile">
      <h1>Perfil del Usuario</h1>

      {/* Información del usuario */}
      <div className="user-info">
        <p>Nombre de usuario: {username}</p>
        <p>Correo electrónico: {userEmail}</p>
      </div>

      {/* Configuración de 2FA */}
      <div className="twofa-settings">
        <h2>Configuración de Autenticación de Dos Factores (2FA)</h2>
        <TwoFASettings email={userEmail} />
      </div>

      {/* Otras opciones de configuración */}
      <div className="other-settings">
        <h2>Otras Configuraciones</h2>
        <button className="btn btn-secondary">Cambiar contraseña</button>
        <button className="btn btn-secondary">Editar perfil</button>
      </div>
    </div>
  );
};

export default Profile;