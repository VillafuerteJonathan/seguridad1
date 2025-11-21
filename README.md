# Secure File Vault 🔐  
Sistema de carga, cifrado y almacenamiento seguro de archivos con doble autenticación

## 📌 Descripción del Proyecto

Aplicación diseñada para proteger información sensible mediante la carga, cifrado y almacenamiento seguro de archivos, como documentos PDF, imágenes, archivos de texto y más.  
Su propósito principal es garantizar **confidencialidad, integridad, disponibilidad y trazabilidad**, aplicando técnicas modernas de seguridad tanto en frontend como en backend.

El sistema se compone de dos módulos principales:

- **Frontend (React):** interfaz de usuario para autenticación (incluyendo doble factor), subida de archivos, visualización del hash y descarga protegida.
- **Backend (Node.js + Express):** recibe archivos, los valida, genera su hash mediante **SHA-256**, los almacena de forma segura y gestiona la autenticación y el 2FA.

Se utilizan **Bootstrap 5** y **Tailwind CSS** para una UI moderna, ligera y totalmente responsiva.

---

## 🔐 Seguridad Implementada

El sistema incorpora múltiples capas de seguridad:

### 🔸 Cifrado y Hash
- **Hash SHA-256** para crear una huella digital única del archivo.
- Nombres de archivo almacenados en formato encriptado para evitar exposición de información sensible.
- Protección contra duplicados basados en hash.

### 🔸 Autenticación y Acceso
- **Login con doble autenticación (2FA)**  
  - Primer factor: usuario y contraseña.  
  - Segundo factor: código temporal (OTP) enviado por email o generado por app autenticadora.
- Sesiones seguras mediante tokens.

### 🔸 Validación y Sanitización
- Middleware para validar tipo y tamaño del archivo.
- Sanitización de entrada para evitar inyección.
- Configuración de **CORS** para restringir orígenes no autorizados.

Estas medidas garantizan almacenamiento seguro, protección contra manipulación y acceso controlado a los archivos.

---

## ✨ Funcionalidades Principales

- Inicio de sesión con **doble autenticación (2FA)**.
- Subida de documentos e imágenes desde el navegador.
- Generación automática del **hash SHA-256** por archivo.
- Almacenamiento seguro con nombres aleatorios cifrados.
- Descarga del archivo original o de su versión procesada.
- Gestión de archivos subidos (listar, visualizar hash, fecha, tipo).
- Interfaz moderna y responsiva con Bootstrap + Tailwind.
- Arquitectura escalable para añadir roles y auditoría en el futuro.

---

## 🚀 Inicio Rápido del Proyecto

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/VillafuerteJonathan/seguridad1.git


🔹 Backend (Node.js)
cd backend
npm install
npm install express multer crypto cors
npm run start

🔹 Frontend (React)
cd frontend
npm install
npm install bootstrap tailwindcss
npm run dev

🛠️ Tecnologías Utilizadas
Frontend

React

Bootstrap 5

Tailwind CSS

Axios / Fetch API

Backend

Node.js + Express

Crypto (SHA-256 hashing)

Multer (manejo de archivos)

CORS

JWT / OTP (para doble autenticación)
