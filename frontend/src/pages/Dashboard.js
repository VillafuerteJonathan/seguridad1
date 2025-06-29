import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UploadForm from '../components/UploadForm';
import MyFiles from '../components/MyFiles';
import SharedFiles from '../components/SharedFiles';
import Profile from '../components/Profile';
import AuditLogs from '../components/AuditLogs';
import Toast from '../components/Toast';

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
          <button onClick={() => setSection('shared')} style={sidebarBtnStyle}>
            🔗 Archivos Compartidos
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
          {section === 'shared' && <SharedFiles />}
          {section === 'audit' && <AuditLogs logs={auditLogs} />}
          {section === 'profile' && <Profile user={currentUser} />}
        </main>
      </div>

      <Toast message={toastMessage} show={!!toastMessage} />
    </div>
  );
};

export default Dashboard;
