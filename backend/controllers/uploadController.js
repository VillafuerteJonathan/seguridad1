const fs = require('fs');
const path = require('path');

const uploadEncryptedContent = (req, res) => {
  const { filename, content } = req.body;

  if (!filename || !content) {
    return res.status(400).json({ message: 'Faltan datos.' });
  }

  const encryptedPath = path.join(__dirname, '../uploads', `${Date.now()}-${filename}.huff`);

  fs.writeFile(encryptedPath, content, (err) => {
    if (err) return res.status(500).json({ message: 'Error al guardar.' });
    return res.json({ message: 'Archivo cifrado recibido y almacenado.', path: encryptedPath });
  });
};

module.exports = {
  uploadEncryptedContent,
};
