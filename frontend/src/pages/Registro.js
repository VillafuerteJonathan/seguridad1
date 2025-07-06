import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Para redireccionar
import 'bootstrap/dist/css/bootstrap.min.css';
import { Eye, EyeOff } from 'lucide-react';

const Registro = () => {
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [confirmarContrasenia, setConfirmarContrasenia] = useState('');
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);
  const [mostrarConfirmarContrasenia, setMostrarConfirmarContrasenia] = useState(false);



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
    // Validar que las contraseñas coincidan
    if (contrasenia !== confirmarContrasenia) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      // Enviar los datos al backend
      const response = await axios.post('http://localhost:5000/auth/register', {
        username: nombre, // Usamos "nombre" como "username"
        email: email, // Campo "email"
        password: contrasenia, // Campo "contrasenia"
      });

      // Redirigir al componente 2FA con los datos necesarios
      navigate('/dFA', {
        state: {
          qrCode: response.data.qrCode, // Código QR
          email: email, // Correo electrónico del usuario
          secret: response.data.secret, // Secreto 2FA (opcional)
        },
      });
    } catch (error) {
      // Manejo de errores
      if (error.response) {
        // El backend respondió con un código de estado fuera del rango 2xx
        const { status, data } = error.response;

        if (status === 400 && data.message === 'El correo electrónico ya está registrado') {
          alert('El correo electrónico ya está registrado');
        } else if (status === 400 && data.message === 'Todos los campos son obligatorios') {
          alert('Todos los campos son obligatorios');
        } else if (status === 500) {
          alert('Error en el servidor. Inténtalo de nuevo más tarde.');
        } else {
          alert('Error desconocido. Inténtalo de nuevo.');
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