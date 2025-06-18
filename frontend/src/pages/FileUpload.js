import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    
    // Validar que todos los campos estén completos
    if (!file || !title || !description) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setError('');
    setIsUploading(true);

    // Crear un objeto FormData para enviar el archivo y los campos
    const formData = new FormData();
    formData.append('file', file); // Archivo
    formData.append('title', title); // Título
    formData.append('description', description); // Descripción

    try {
      // Enviar la solicitud al backend
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Envía el token JWT
        },
      });

      // Mostrar mensaje de éxito
      console.log('Archivo subido:', response.data);
      alert('Archivo subido y cifrado correctamente');

      // Limpiar el formulario después de la subida
      setFile(null);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Error al subir el archivo:', err);

      // Mostrar mensaje de error
      if (err.response) {
        setError(err.response.data.message || 'Error al subir el archivo');
      } else if (err.request) {
        setError('No se recibió respuesta del servidor');
      } else {
        setError('Error al realizar la solicitud');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h2>Subir Archivo</h2>

      {/* Mostrar mensajes de error */}
      {error && <div className="error-message" style={{color: 'red'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Campo para el título */}
        <div className="form-group">
          <label>Título:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ingresa un título"
            required
          />
        </div>

        {/* Campo para la descripción */}
        <div className="form-group">
          <label>Descripción:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ingresa una descripción"
            required
          />
        </div>

        {/* Campo para el archivo */}
        <div className="form-group">
          <label>Archivo:</label>
          <input 
            type="file" 
            onChange={handleFileChange} 
            required 
          />
        </div>

        {/* Botón para subir el archivo */}
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Subiendo...' : 'Subir Archivo'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;