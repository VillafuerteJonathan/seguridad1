const express = require("express");
const cors = require("cors");

// Crear una instancia de Express
const app = express();

// Middlewares
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Parsear el cuerpo de las solicitudes en formato JSON

// Importar el controlador de registro
const { register } = require('./controllers/authController');

// Ruta para el registro
app.post('/auth/register', register);

// Iniciar el servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});