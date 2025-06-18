import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Eye, EyeOff } from 'react-feather';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const toggleMostrarContrasenia = () => {
    setMostrarContrasenia(!mostrarContrasenia);
  };

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

      console.log('Respuesta recibida:', response.data);

      if (response.data.requires2FA) {
        navigate('/dfa', {
          state: {
            email: response.data.email,
            qrCode: response.data.qrCode || null,
          },
        });
        return;
      }

      console.log('Guardando token y user en localStorage...');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('Token guardado:', localStorage.getItem('token'));
      console.log('Usuario guardado:', JSON.parse(localStorage.getItem('user')));

      // Comenta temporalmente la navegación para ver logs
      // navigate('/home');
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 400 && data.message === 'Todos los campos son obligatorios') {
          setError('Todos los campos son obligatorios');
        } else if (status === 404 && data.message === 'Usuario no encontrado') {
          setError('Usuario no encontrado');
        } else if (status === 401 && data.message === 'Credenciales inválidas') {
          setError('Credenciales inválidas');
        } else if (status === 400 && data.message === 'Código de 2FA incorrecto') {
          setError('Código de 2FA incorrecto');
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
    <div className="login-container d-flex justify-content-center align-items-center vh-100">
      <div className="login-card card p-4 shadow" style={{ maxWidth: 400, width: '100%' }}>
        <div className="card-header text-center fs-4 fw-bold">Iniciar Sesión</div>
        <div className="card-body">
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="mb-3 input-group">
              <input
                type={mostrarContrasenia ? 'text' : 'password'}
                className="form-control"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={toggleMostrarContrasenia}
                aria-label={mostrarContrasenia ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarContrasenia ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          <p className="mt-3 text-center">
            ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
