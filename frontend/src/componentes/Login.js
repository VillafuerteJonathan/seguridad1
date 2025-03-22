import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Eye, EyeOff } from 'react-feather'; // Importar íconos de Feather Icons

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);
  const navigate = useNavigate();

  // Función para alternar entre mostrar y ocultar la contraseña
  const toggleMostrarContrasenia = () => {
    setMostrarContrasenia(!mostrarContrasenia);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/auth/login', {
        email,
        password,
      });

      // Guardar el token en el localStorage
      localStorage.setItem('token', response.data.token);

      alert('Inicio de sesión exitoso');
      console.log('Token:', response.data.token);

      // Redirigir al usuario a la página principal
      navigate('/home');
    } catch (error) {
      if (error.response) {
        // El backend respondió con un código de estado fuera del rango 2xx
        const { status, data } = error.response;

        if (status === 400 && data.message === 'Todos los campos son obligatorios') {
          alert('Todos los campos son obligatorios');
        } else if (status === 404 && data.message === 'Usuario no encontrado') {
          alert('Usuario no encontrado');
        } else if (status === 401 && data.message === 'Credenciales inválidas') {
          alert('Credenciales inválidas');
        } else {
          alert('Error en el servidor. Inténtalo de nuevo más tarde.');
        }
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        alert('No se recibió respuesta del servidor. Verifica tu conexión a internet.');
      } else {
        // Algo más causó el error
        alert('Error al realizar la solicitud. Inténtalo de nuevo.');
      }

      console.error(error); // Muestra el error en la consola para depuración
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card-header">Iniciar Sesión</div>
        <div className="card-body">
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3 input-group">
            <input
              type={mostrarContrasenia ? 'text' : 'password'}
              className="form-control"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={toggleMostrarContrasenia}
            >
              {mostrarContrasenia ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button className="btn btn-primary w-100" onClick={handleLogin}>
            Iniciar Sesión
          </button>
          <p className="mt-3 text-center">
            ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;