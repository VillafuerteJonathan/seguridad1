// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const tk = require('../controllers/loginController')

const authenticateUser = (req, res, next) => {
  // Obtener el token del encabezado de la solicitud
  const token = req.headers.authorization?.split(tk.login)[1]; // Formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'No autorizado: Token no proporcionado' });
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Usa tu clave secreta

    // Asignar el ID del usuario al objeto `req`
    req.user = { id: decoded.userId }; // Asegúrate de que el token incluya el ID del usuario

    // Continuar con el siguiente middleware o controlador  
    next();
  } catch (err) {
    console.error('Error al verificar el token:', err);
    return res.status(401).json({ message: 'No autorizado: Token inválido' });
  }
};

module.exports = authenticateUser;