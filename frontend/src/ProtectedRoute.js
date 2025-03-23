import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // Verificar si el usuario está autenticado
  if (!token) {
    return <Navigate to="/" replace />; // Redirigir al login si no hay token
  }
  return children; // Permitir el acceso si hay token
};

export default ProtectedRoute;