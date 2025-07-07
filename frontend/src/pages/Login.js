import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Eye, EyeOff } from 'react-feather';
import CryptoJS from 'crypto-js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const AES_SECRET = 'misuperclave1234567890123456';

  const toggleMostrarContrasenia = () => {
    setMostrarContrasenia(!mostrarContrasenia);
  };

    const handleLogin = async (e) => {
    e.preventDefault();

    const caracteresPeligrosos = /['";\\]/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (caracteresPeligrosos.test(email) || caracteresPeligrosos.test(password)) {
      setError('No se permiten caracteres especiales como comillas, punto y coma o barras invertidas');
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Formato de correo electrónico inválido');
      return;
    }

    if (email.length > 100) {
      setError('El email es demasiado largo (máx. 100 caracteres)');
      return;
    }

    if (password.length < 8 ) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    const encryptedEmail = CryptoJS.AES.encrypt(email.trim(), AES_SECRET).toString();
    const encryptedPassword = CryptoJS.AES.encrypt(password, AES_SECRET).toString();

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/auth/login', {
        email: encryptedEmail,
        password: encryptedPassword,
      });

      if (response.data.requires2FA) {
        navigate('/dfa', {
          state: {
            email: response.data.email,
            qrCode: response.data.qrCode || null,
            fromRegister: false
          },
        });
        return;
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/home'); // ✅ habilita navegación real si lo deseas
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
          setError('Error: ' + data.message);
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
