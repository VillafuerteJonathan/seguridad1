const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Cargar variables de entorno desde un archivo .env

// Crear una instancia de Express
const app = express();

// Middlewares
app.use(cors()); // Habilitar CORS (puedes configurarlo para producción)
app.use(express.json()); // Parsear el cuerpo de las solicitudes en formato JSON

// Importar controladores
const { register } = require("./controllers/authController");
const { login } = require("./controllers/loginController");
const twoFARoutes = require("./controllers/dFAController"); // Importar las rutas de 2FA

// Rutas
app.post("/auth/register", register); // Ruta para el registro
app.post("/auth/login", login); // Ruta para el login
app.use("/auth", twoFARoutes); // Rutas de 2FA bajo el prefijo /auth

// Middleware para manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack); // Log del error en la consola
  res.status(500).json({ message: "Algo salió mal en el servidor" });
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000; // Usar variable de entorno o 5000 por defecto
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});