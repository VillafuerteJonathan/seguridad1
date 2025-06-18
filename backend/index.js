const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware de carga
app.use(cors());
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));
;

// Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const twoFARoutes = require("./controllers/dFAController");
const fileRoutes = require('./routes/fileRouter');

app.use('/auth', authRoutes);       // /auth/login y /auth/register
app.use('/api/users', userRoutes);  // /api/users
app.use('/auth', twoFARoutes);      // /auth/verify-2fa o similar
app.use('/api', fileRoutes);        // /api/upload, /api/files, etc.

// Middleware de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Algo salió mal en el servidor" });
});

// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
