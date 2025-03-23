import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Eye, EyeOff } from 'react-feather'; // Importar íconos de Feather Icons

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Función para alternar entre mostrar y ocultar la contraseña
  const toggleMostrarContrasenia = () => {
    setMostrarContrasenia(!mostrarContrasenia);
  };

  // Función para manejar el inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/auth/login', {
        email,
        password,
      });

      // Si el 2FA está habilitado, redirigir al componente 2FA con los datos necesarios
      if (response.data.requires2FA) {
        navigate('/dFA', {
          state: {
            qrCode: response.data.qrCode,
            email: response.data.email,
          },
        });
        return;
      }

      // Si no requiere 2FA, guardar el token y redirigir al dashboard
      localStorage.setItem('token', response.data.token);
      navigate('/home');
    } catch (error) {
      // Manejo de errores
      if (error.response) {
        const { status, data } = error.response;
        if (status === 400 && data.message === 'Todos los campos son obligatorios') {
          setError('Todos los campos son obligatorios');
        } else if (status === 404 && data.message === 'Usuario no encontrado') {
          setError('Usuario no encontrado');
        } else if (status === 401 && data.message === 'Credenciales inválidas') {
          setError('Credenciales inválidas');
        } else {
          setError('Error en el servidor. Inténtalo de nuevo más tarde.');
        }
      } else if (error.request) {
        setError('No se recibió respuesta del servidor. Verifica tu conexión a internet.');
      } else {
        setError('Error al realizar la solicitud. Inténtalo de nuevo.');
      }
      console.error(error);
    } finally {
      setIsLoading(false);
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
          {error && <div className="alert alert-danger">{error}</div>}
          <button
            className="btn btn-primary w-100"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
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