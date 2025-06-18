import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

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

// Función de codificación Huffman (como la tienes)
const huffmanEncode = (input) => {
  const freq = {};
  for (const char of input) {
    freq[char] = (freq[char] || 0) + 1;
  }

  const heap = Object.entries(freq).map(([char, freq]) => ({ char, freq }));
  while (heap.length > 1) {
    heap.sort((a, b) => a.freq - b.freq);
    const left = heap.shift();
    const right = heap.shift();
    heap.push({ char: null, freq: left.freq + right.freq, left, right });
  }

  const tree = heap[0];
  const codes = {};
  const buildCodes = (node, code) => {
    if (node.char) {
      codes[node.char] = code;
    } else {
      buildCodes(node.left, code + '0');
      buildCodes(node.right, code + '1');
    }
  };
  buildCodes(tree, '');

  let encoded = '';
  for (const char of input) {
    encoded += codes[char];
  }

  return { encoded };
};

// Formulario para subir archivos
const UploadForm = ({ user }) => {
  const [file, setFile] = useState(null);
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !clave) return alert("Debes seleccionar un archivo y una clave.");

    setLoading(true);

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        // Leer archivo como ArrayBuffer
        const arrayBuffer = reader.result;

        // Convertir a base64 para cifrarlo con Huffman (que usa string)
        const base64String = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Concatenar clave para integrarla en el cifrado
        const toEncode = base64String + clave;

        // Aplicar Huffman
        const { encoded } = huffmanEncode(toEncode);

        // Enviar JSON con archivo cifrado + clave + usuario stringify
        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            content: encoded,
            clave: clave,
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
        <h3>Cargar archivo PDF cifrado (Huffman)</h3>
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

// Perfil de usuario
const Profile = ({ user }) => {
  if (!user) return <div>Cargando perfil...</div>;
  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-body">
        <h2 className="card-title mb-4">👤 Perfil del Usuario</h2>
        <p><strong>Nombre de usuario:</strong> {user.username}</p>
        {user.email && <p><strong>Email:</strong> {user.email}</p>}
        {user.role && <p><strong>Rol:</strong> {user.role}</p>}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [section, setSection] = useState('upload');
  const [filesDB] = useState([]);
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

  const MyFiles = () => <div><h2>Mis archivos</h2></div>;
  const AuditLogs = () => <div><h2>Auditoría</h2></div>;
  const LoginScreen = () => <div><h2>Login</h2></div>;
  const Toast = ({ message, show }) => show ? (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      backgroundColor: '#333',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: 8,
    }}>
      {message}
    </div>
  ) : null;

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/dashboard">Bienvenido, {usuario}</Link>
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
          <button onClick={() => setSection('upload')} style={sidebarBtnStyle}>📁 Carga de Archivos</button>
          <button onClick={() => setSection('myfiles')} style={sidebarBtnStyle}>📄 Mis Archivos</button>
          <button onClick={() => setSection('audit')} style={sidebarBtnStyle}>🕵️ Auditoría</button>
          <button onClick={() => setSection('profile')} style={sidebarBtnStyle}>👤 Perfil</button>
          <hr style={{ borderColor: '#334155' }} />
          <button
            onClick={handleLogout}
            style={{ ...sidebarBtnStyle, backgroundColor: '#ef4444' }}
          >
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
