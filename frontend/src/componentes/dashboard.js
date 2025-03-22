import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');

  // Verificar si el usuario está autenticado y obtener sus datos
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Si no hay token, redirigir al usuario a la página de inicio de sesión
      navigate('/');
    } else {
      // Obtener los datos del usuario (puedes almacenarlos en el estado)
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setUsuario(userData.username); // Asumiendo que el backend devuelve un campo "username"
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    // Eliminar el token y los datos del usuario del localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirigir al usuario a la página de inicio de sesión
    navigate('/');
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/dashboard">
            Dashboard
          </Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button className="btn btn-danger" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="container mt-5">
        <h2>Bienvenido, {usuario}!</h2>
        <p>Has iniciado sesión correctamente.</p>
        <button className="btn btn-primary">Explorar</button>
      </div>
    </div>
  );
};

export default Dashboard;