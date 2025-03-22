import React, { useState } from 'react';
import axios from 'axios';


import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      alert('Inicio de sesión exitoso');
      // Aquí redirigirías al dashboard o manejarías el siguiente paso (2FA)
    } catch (error) {
      alert('Credenciales inválidas');
    }
  };

  const handleRegisterRedirect = () => {
    // Aquí redirigirías a la página de registro
    alert('Redirigiendo a la página de registro');
  };

  return (<div class="login-container">
    <div class="login-card">
      <div class="card-header">Iniciar Sesión</div>
      <div class="card-body">
        <div class="mb-3">
          <input
            type="email"
            class="form-control"
            id="exampleFormControlInput1"
            placeholder="Usuario"
          />
        </div>
        <div class="mb-3">
          <input
            type="password"
            class="form-control"
            id="exampleInputPassword1"
            placeholder="Contraseña"
          />
        </div>
        <button class="btn btn-primary w-100">Iniciar Sesión</button>
        <p class="mt-3 text-center">
          ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>.
        </p>
      </div>
    </div>
  </div>
  );
};

export default Login;