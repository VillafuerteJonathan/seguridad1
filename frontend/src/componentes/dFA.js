import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const TwoFA = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { qrCode, email } = location.state || {};
  const [twoFAToken, setTwoFAToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Verificar si los datos necesarios están presentes
  useEffect(() => {
    if (!email) {
      // Si no hay qrCode o email, redirigir al usuario a la página de inicio de sesión
      navigate('/');
    }
  }, [qrCode, email, navigate]);


  const handle2FAVerification = async (e) => {
    e.preventDefault();

    if (!twoFAToken) {
      setError('Por favor, ingresa el código 2FA');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/auth/verify-2fa', {
        email,
        token: twoFAToken,
      });

      // Si el código 2FA es válido, guardar el token y redirigir al dashboard
      localStorage.setItem('token', response.data.token);
      navigate('/home');
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401 && data.message === 'Código 2FA inválido') {
          setError('Código 2FA inválido');
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
        <h1>Verificación de 2FA</h1>
        <p>Ingresa el codigo que te da la aplicacion de autentificacion :</p>
        { qrCode &&  <img src={qrCode} alt="Código QR" className="qr-code" />} 
        <div className="form-group"> 
          <input
            type="text"
            placeholder="Código 2FA"
            value={twoFAToken}
            onChange={(e) => setTwoFAToken(e.target.value)}
            className="form-control"
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button
          className="btn btn-primary"
          onClick={handle2FAVerification}
          disabled={isLoading}
        >
          {isLoading ? 'Verificando...' : 'Verificar'}
        </button>
      </div>
    </div>
  );
};

export default TwoFA;