import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  aesEncrypt,
  aesDecrypt,
  stringToBytes,
  bytesToString
} from '../utils/aes128';

const sidebarBtnStyle = {
  background: 'none',
  color: '#fff',
  textAlign: 'left',
  fontSize: 16,
  padding: '8px 0',
  cursor: 'pointer',
  transition: 'background 0.2s',
  borderRadius: 6,
  border: 'none',
};

// --- Helpers para manejar bytes y bloques ---
const chunkArray = (arr, size = 16) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const padBlock = (block, size = 16) => {
  const padded = block.slice();
  while (padded.length < size) {
    padded.push(0);
  }
  return padded;
};

const bytesToBase64 = (bytes) => {
  const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), '');
  return btoa(binary);
};

const base64ToBytes = (base64) => {
  const binary = atob(base64);
  const bytes = [];
  for (let i = 0; i < binary.length; i++) {
    bytes.push(binary.charCodeAt(i));
  }
  return bytes;
};

// --- Encriptar y desencriptar buffers completos ---
const encryptData = (dataBytes, key) => {
  const keyBytes = typeof key === 'string' ? stringToBytes(key) : key;
  const blocks = chunkArray(dataBytes, 16);
  let encrypted = [];
  blocks.forEach((block) => {
    const padded = padBlock(block);
    const encryptedBlock = aesEncrypt(padded, keyBytes);
    encrypted = encrypted.concat(encryptedBlock);
  });
  return encrypted;
};

const decryptData = (encryptedBytes, key) => {
  const keyBytes = typeof key === 'string' ? stringToBytes(key) : key;
  const blocks = chunkArray(encryptedBytes, 16);
  let decrypted = [];
  blocks.forEach((block) => {
    const decryptedBlock = aesDecrypt(block, keyBytes);
    decrypted = decrypted.concat(decryptedBlock);
  });
  return decrypted;
};

// ------------------ Componentes -------------------

const UploadForm = ({ user }) => {
  const [file, setFile] = useState(null);
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !clave) return alert('Debes seleccionar un archivo y una clave.');

    setLoading(true);

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result;
        const bytes = Array.from(new Uint8Array(arrayBuffer));

        // Cifrar con AES-128 por bloques
        const encryptedBytes = encryptData(bytes, clave);
        const encryptedBase64 = bytesToBase64(encryptedBytes);

        // Enviar al backend
        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            content: encryptedBase64,
            user: JSON.stringify(user),
          }),
        });

        const data = await res.json();
        alert(data.message || 'Archivo subido correctamente');
        setFile(null);
        setClave('');
      } catch (error) {
        console.error('Error al subir archivo:', error);
        alert('Error al subir archivo.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-body">
        <h3>Cargar archivo PDF cifrado (AES-128)</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Seleccionar PDF:</label>
            <input
              type="file"
              className="form-control"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Clave de cifrado:</label>
            <input
              type="text"
              className="form-control"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Subiendo...' : 'Cifrar y subir'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Profile = ({ user }) => {
  if (!user) return <div>Cargando perfil...</div>;
  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-body">
        <h2 className="card-title mb-4">👤 Perfil del Usuario</h2>
        <p>
          <strong>Nombre de usuario:</strong> {user.username}
        </p>
        {user.email && (
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        )}
        {user.role && (
          <p>
            <strong>Rol:</strong> {user.role}
          </p>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [section, setSection] = useState('upload');
  const [auditLogs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUsuario(userData.username);
      setCurrentUser(userData);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Componente interno para listar y descifrar archivos
  const MyFiles = () => {
    const [archivos, setArchivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarContenido, setMostrarContenido] = useState(null);
    const [claveDescifrado, setClaveDescifrado] = useState('');
    const [textoDescifrado, setTextoDescifrado] = useState(null);
    const [errorClave, setErrorClave] = useState('');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
      const fetchArchivos = async () => {
        if (!currentUser || !currentUser.id) {
          setLoading(false);
          return;
        }
        try {
          const res = await fetch(`http://localhost:5000/api/user-files?userId=${currentUser.id}`);
          const data = await res.json();
          setArchivos(data);
        } catch (error) {
          console.error('Error al obtener archivos:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchArchivos();
    }, [currentUser]);

    const handleDescifrar = () => {
      setErrorClave('');
      setTextoDescifrado(null);
      try {
        const encryptedBytes = base64ToBytes(mostrarContenido);
        const decryptedBytes = decryptData(encryptedBytes, claveDescifrado);

        // Crear Blob PDF y URL para iframe
        const blob = new Blob([new Uint8Array(decryptedBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setTextoDescifrado(url);
      } catch (err) {
        console.error(err);
        setErrorClave('Clave incorrecta o error al descifrar');
      }
    };

    return (
      <div>
        <h3>📄 Mis Archivos</h3>
        {loading ? (
          <p>Cargando archivos...</p>
        ) : archivos.length === 0 ? (
          <p>No tienes archivos aún.</p>
        ) : (
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Nombre</th>
                <th>Subido en</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {archivos.map((file) => (
                <tr key={file.id}>
                  <td>{file.filename}</td>
                  <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setMostrarContenido(file.encrypted_content);
                        setTextoDescifrado(null);
                        setClaveDescifrado('');
                        setErrorClave('');
                      }}
                    >
                      🔐 Ver Cifrado
                    </button>{' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {mostrarContenido && (
          <div className="alert alert-secondary mt-3">
            <strong>Contenido Cifrado (base64):</strong>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{mostrarContenido}</pre>

            <div className="mt-3">
              <label>Clave para descifrar:</label>
              <input
                type="text"
                className="form-control"
                value={claveDescifrado}
                onChange={(e) => setClaveDescifrado(e.target.value)}
              />
              <button className="btn btn-success mt-2" onClick={handleDescifrar}>
                🔓 Descifrar
              </button>
              {errorClave && <p className="text-danger mt-2">{errorClave}</p>}
            </div>

            {textoDescifrado && (
              <div className="mt-3">
                <strong>Archivo PDF descifrado:</strong>
                <iframe
                  src={textoDescifrado}
                  title="Archivo Descifrado"
                  width="100%"
                  height="600px"
                  style={{ border: '1px solid #ccc' }}
                />
              </div>
            )}

            <button
              className="btn btn-sm btn-danger mt-3"
              onClick={() => {
                setMostrarContenido(null);
                setTextoDescifrado(null);
                setClaveDescifrado('');
                setErrorClave('');
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    );
  };

  const AuditLogs = () => (
    <div>
      <h2>Auditoría</h2>
      {/* Implementa aquí tu vista de auditoría si quieres */}
    </div>
  );

  const LoginScreen = () => <div><h2>Login</h2></div>;

  const Toast = ({ message, show }) =>
    show ? (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          backgroundColor: '#333',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 8,
        }}
      >
        {message}
      </div>
    ) : null;

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/dashboard">
            Bienvenido, {usuario}
          </Link>
        </div>
      </nav>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside
          style={{
            width: 220,
            backgroundColor: '#1e293b',
            color: '#fff',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 'bold' }}>Menú</h2>
          <button onClick={() => setSection('upload')} style={sidebarBtnStyle}>
            📁 Carga de Archivos
          </button>
          <button onClick={() => setSection('myfiles')} style={sidebarBtnStyle}>
            📄 Mis Archivos
          </button>
          <button onClick={() => setSection('audit')} style={sidebarBtnStyle}>
            🕵️ Auditoría
          </button>
          <button onClick={() => setSection('profile')} style={sidebarBtnStyle}>
            👤 Perfil
          </button>
          <hr style={{ borderColor: '#334155' }} />
          <button onClick={handleLogout} style={{ ...sidebarBtnStyle, backgroundColor: '#ef4444' }}>
            Cerrar sesión
          </button>
        </aside>

        <main style={{ flex: 1, padding: 24 }}>
          {section === 'upload' && <UploadForm user={currentUser} />}
          {section === 'myfiles' && <MyFiles />}
          {section === 'audit' && <AuditLogs logs={auditLogs} />}
          {section === 'profile' && <Profile user={currentUser} />}
          {section === 'login' && <LoginScreen />}
        </main>
      </div>

      <Toast message={toastMessage} show={!!toastMessage} />
    </div>
  );
};

export default Dashboard;
