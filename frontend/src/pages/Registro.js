import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Para redireccionar
import 'bootstrap/dist/css/bootstrap.min.css';
import { Eye, EyeOff } from 'lucide-react';
import CryptoJS from 'crypto-js';

const Registro = () => {
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [confirmarContrasenia, setConfirmarContrasenia] = useState('');
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);
  const [mostrarConfirmarContrasenia, setMostrarConfirmarContrasenia] = useState(false);

  const AES_SECRET = 'misuperclave1234567890123456';


  // Hook para redirección
  const navigate = useNavigate();

  // Función para alternar entre mostrar y ocultar la contraseña
  const toggleMostrarContrasenia = () => {
    setMostrarContrasenia(!mostrarContrasenia);
  };

  // Función para alternar entre mostrar y ocultar la confirmación de contraseña
  const toggleMostrarConfirmarContrasenia = () => {
    setMostrarConfirmarContrasenia(!mostrarConfirmarContrasenia);
  };

  // Función para manejar el envío del formulario
const handleRegistro = async () => {
  const caracteresPeligrosos = /['";\\]/;

  if (!nombre || !email || !contrasenia || !confirmarContrasenia) {
    alert('Todos los campos son obligatorios');
    return;
  }

  if (caracteresPeligrosos.test(nombre) || caracteresPeligrosos.test(email)) {
    alert('No se permiten caracteres especiales como comillas, punto y coma o barras invertidas');
    return;
  }

  if (nombre.length > 50) {
    alert('El nombre es demasiado largo (máx. 50 caracteres)');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Formato de correo electrónico inválido');
    return;
  }

  if (contrasenia.length < 8) {
    alert('La contraseña debe tener al menos 8 caracteres');
    return;
  }

  if (contrasenia !== confirmarContrasenia) {
    alert('Las contraseñas no coinciden');
    return;
  }
  const encryptedUsername = CryptoJS.AES.encrypt(nombre, AES_SECRET).toString();
  const encryptedEmail = CryptoJS.AES.encrypt(email, AES_SECRET).toString();
  const encryptedPassword = CryptoJS.AES.encrypt(contrasenia, AES_SECRET).toString();

  try {
    const response = await axios.post('http://localhost:5000/auth/register', {
      username: encryptedUsername,
      email: encryptedEmail,
      password: encryptedPassword,
    });

    navigate('/dFA', {
      state: {
        qrCode: response.data.qrCode,
        email: email,
        secret: response.data.secret,
        fromRegister: true
      },
    });
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 400 && data.message === 'El correo electrónico ya está registrado') {
        alert('El correo electrónico ya está registrado');
      } else if (status === 400 && data.message === 'Todos los campos son obligatorios') {
        alert('Todos los campos son obligatorios');
      } else {
        alert('Error: ' + data.message);
      }
    } else {
      alert('Error de red o del servidor');
    }
    console.error(error);
  }
};


  // Mostrar el formulario de registro
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card-header">¡Bienvenido!</div>
        <p className="text-center mt-2">Regístrate para empezar</p>
        <div className="card-body">
          {/* Campo para el nombre (username) */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          {/* Campo para el email */}
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Campo para la contraseña */}
          <div className="mb-3">
            <div className="input-group">
              <input
                type={mostrarContrasenia ? 'text' : 'password'}
                className="form-control"
                placeholder="Contraseña"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={toggleMostrarContrasenia}
              >
                {mostrarContrasenia ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Campo para confirmar la contraseña */}
          <div className="mb-3">
            <div className="input-group">
              <input
                type={mostrarConfirmarContrasenia ? 'text' : 'password'}
                className="form-control"
                placeholder="Confirmar Contraseña"
                value={confirmarContrasenia}
                onChange={(e) => setConfirmarContrasenia(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={toggleMostrarConfirmarContrasenia}
              >
                {mostrarConfirmarContrasenia ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Botón de registro */}
          <button className="btn btn-primary w-100" onClick={handleRegistro}>
            Registrarse
          </button>

          {/* Enlace para redirigir al inicio de sesión */}
          <p className="mt-3 text-center">
            ¿Ya tienes una cuenta? <a href="/">Inicia sesión aquí</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;