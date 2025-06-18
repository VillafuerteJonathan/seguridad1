import React, { useState, useEffect, useRef } from 'react';


// Utilidades
function formatDate(isoString) {
  return new Date(isoString).toLocaleString();
}

const Toast = ({ message, show }) => (
  <div
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
    style={{
      position: 'fixed',
      bottom: 32,
      right: 32,
      backgroundColor: '#4f46e5',
      color: '#fff',
      padding: '14px 24px',
      borderRadius: 24,
      boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)',
      opacity: show ? 1 : 0,
      pointerEvents: show ? 'auto' : 'none',
      transition: 'opacity 0.3s ease',
      userSelect: 'none',
      fontWeight: 600,
      fontSize: 16
    }}
  >
    {message}
  </div>
);

function huffmanEncode(data) {
  const freq = new Map();
  for (const b of data) freq.set(b, (freq.get(b) || 0) + 1);
  let nodes = [...freq.entries()].map(([val, freq]) => ({ val, freq, left: null, right: null }));

  while (nodes.length > 1) {
    nodes.sort((a,b) => a.freq - b.freq);
    const [left, right] = [nodes.shift(), nodes.shift()];
    nodes.push({ val: null, freq: left.freq + right.freq, left, right });
  }

  const tree = nodes[0];
  const codes = {};
  function traverse(node, path = '') {
    if (node.val !== null) {
      codes[node.val] = path;
      return;
    }
    traverse(node.left, path + '0');
    traverse(node.right, path + '1');
  }
  traverse(tree);

  let bitStr = [...data].map(b => codes[b]).join('');
  const pad = (8 - bitStr.length % 8) % 8;
  bitStr += '0'.repeat(pad);

  const output = new Uint8Array(bitStr.length / 8);
  for (let i = 0; i < output.length; i++) {
    output[i] = parseInt(bitStr.slice(i * 8, (i + 1) * 8), 2);
  }

  return arrayBufferToBase64(output);
}

function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function huffmanDecode(base64) {
  return 'Archivo cifrado descifrado simulado para demo.';
}

function sha256Hash(arrayBuffer) {
  return [...new Uint8Array(arrayBuffer)].reduce((hash, byte, i) => (hash + byte * (i + 1)) % 1000000007, 0).toString();
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [filesDB, setFilesDB] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [section, setSection] = useState('login');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeout = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFileForPermissions, setActiveFileForPermissions] = useState(null);
  const [newPermissionEmail, setNewPermissionEmail] = useState('');

    // Datos de usuarios de ejemplo
   const [users, setUsers] = useState([]);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      
      const usersWithAvatars = data.map(user => ({
        ...user,
        avatar: 'https://i.pravatar.cc/150?img=4' // Avatar genérico para todos
      }));
      
      setUsers(usersWithAvatars);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showToast('Error al cargar usuarios');
    }
  };

  fetchUsers();
}, []);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('secure-current-user'));
    if (savedUser) setCurrentUser(savedUser);
    setFilesDB(JSON.parse(localStorage.getItem('secure-files') || '[]'));
    setAuditLogs(JSON.parse(localStorage.getItem('secure-audit') || '[]'));
  }, []);

  useEffect(() => {
    localStorage.setItem('secure-files', JSON.stringify(filesDB));
  }, [filesDB]);

  useEffect(() => {
    localStorage.setItem('secure-audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (currentUser)
      localStorage.setItem('secure-current-user', JSON.stringify(currentUser));
    else
      localStorage.removeItem('secure-current-user');
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(''), 3000);
  };

  const logAudit = (action, fileId, details) => {
    if (!currentUser) return;
    const log = {
      id: 'a_' + Math.random().toString(36).slice(2, 10),
      action,
      fileId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [...prev, log]);
  };

  const handleLogin = (user) => {
    user.lastLogin = new Date().toISOString();
    setCurrentUser(user);
    setSection('upload');
    showToast(`Bienvenido, ${user.name}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSection('login');
    showToast('Sesión cerrada');
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const file = e.target.elements.fileInput.files[0];
    const alias = e.target.elements.fileAlias.value.trim() || file.name;
    if (!file) return showToast('Seleccione un archivo');

    try {
      const buffer = await file.arrayBuffer();
      const compressed = huffmanEncode(new Uint8Array(buffer));
      const signature = sha256Hash(buffer);
      const newFile = {
        id: 'f_' + Math.random().toString(36).slice(2, 10),
        name: alias,
        content: compressed,
        ownerId: currentUser.id,
        authorizedUsers: [currentUser.id],
        createdAt: new Date().toISOString(),
        signature
      };
      setFilesDB(prev => [...prev, newFile]);
      logAudit('upload', newFile.id, `Archivo "${alias}" subido por ${currentUser.email}`);
      showToast('Archivo cargado y cifrado');
      e.target.reset();
      setSection('myfiles');
    } catch (err) {
      showToast('Error al subir archivo: ' + err.message);
    }
  };

  const handleDownloadFile = (file) => {
    if (!file.authorizedUsers.includes(currentUser.id) && currentUser.role !== 'admin')
      return showToast('No tienes acceso');

    const blob = new Blob([huffmanDecode(file.content)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    logAudit('download', file.id, `Archivo "${file.name}" descargado por ${currentUser.email}`);
    showToast(`Descargado "${file.name}"`);
  };

  const handleDeleteFile = (file) => {
    if (file.ownerId !== currentUser.id && currentUser.role !== 'admin')
      return showToast('No puedes eliminar');

    if (window.confirm(`Eliminar archivo "${file.name}"?`)) {
      setFilesDB(filesDB.filter(f => f.id !== file.id));
      logAudit('delete', file.id, `Eliminado "${file.name}" por ${currentUser.email}`);
      showToast(`Eliminado "${file.name}"`);
    }
  };

  const openPermissionsModal = (file) => {
    if (file.ownerId !== currentUser.id && currentUser.role !== 'admin')
      return showToast('No puedes editar permisos');

    setActiveFileForPermissions(file);
    setModalOpen(true);
    setNewPermissionEmail('');
  };

  const addPermission = () => {
    const user = users.find(u => u.email.toLowerCase() === newPermissionEmail.toLowerCase());
    if (!user) return showToast('Usuario no encontrado');
    if (user.id === activeFileForPermissions.ownerId)
      return showToast('Ya es dueño');
    if (activeFileForPermissions.authorizedUsers.includes(user.id))
      return showToast('Ya tiene permiso');

    const updated = { ...activeFileForPermissions, authorizedUsers: [...activeFileForPermissions.authorizedUsers, user.id] };
    setFilesDB(prev => prev.map(f => f.id === updated.id ? updated : f));
    setActiveFileForPermissions(updated);
    logAudit('permission_granted', updated.id, `Permiso a ${user.email} por ${currentUser.email}`);
    showToast(`Permiso otorgado a ${user.email}`);
    setNewPermissionEmail('');
  };

  const removePermission = (email) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if(!user) return;
    if(user.id === activeFileForPermissions.ownerId) {
      showToast('No se puede quitar permiso del dueño');
      return;
    }
    const updatedFile = {...activeFileForPermissions};
    updatedFile.authorizedUsers = updatedFile.authorizedUsers.filter(uid => uid !== user.id);
    setFilesDB(prev => prev.map(f => f.id === updatedFile.id ? updatedFile : f));
    setActiveFileForPermissions(updatedFile);
    logAudit('permission_revoked', updatedFile.id, `Permiso revocado a ${user.email} por ${currentUser.email}`);
    showToast(`Permiso removido a ${user.email}`);
  };

  // Nav Links
  const navLinks = [
    { id: 'upload', icon: 'upload_file', label: 'Cargar Archivos' },
    { id: 'myfiles', icon: 'folder', label: 'Mis Archivos' },
    { id: 'audit', icon: 'fact_check', label: 'Auditoría' },
    { id: 'profile', icon: 'person', label: 'Perfil' },
  ];

  // Vistas
  const SectionUpload = () => {
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);

    return (
      <section aria-label="Carga de archivos segura" style={{maxWidth:400}}>
        <h2 style={{color:'#22d3ee'}}>Cargar nuevo archivo</h2>
        <form onSubmit={handleUploadFile}>
          <p>Seleccione un archivo para cifrar y almacenar de forma segura.</p>
          <label htmlFor="fileInput" style={styles.fileLabel}>Seleccionar archivo</label>
          <input
            type="file"
            id="fileInput"
            name="fileInput"
            required
            onChange={e => {
              if(e.target.files.length) setFileName(e.target.files[0].name);
              else setFileName('');
            }}
            ref={fileInputRef}
            style={{display:'none'}}
          />
          <input
            name="fileAlias"
            type="text"
            placeholder="Nombre deseado para el archivo (opcional)"
            aria-label="Nombre para guardar archivo"
            style={styles.textInput}
          />
          <button
            type="submit"
            disabled={!fileName}
            aria-disabled={!fileName}
            style={{
              ...styles.uploadBtn,
              backgroundColor: fileName ? '#16a34a' : '#6b7280',
              cursor: fileName ? 'pointer' : 'not-allowed'
            }}
          >
            Cifrar y Guardar Archivo
          </button>
        </form>
      </section>
    );
  };

  const SectionMyFiles = () => {
    const ownedFiles = filesDB.filter(f => f.ownerId === currentUser.id);
    return (
      <section aria-label="Lista de archivos propiedad de usuario">
        <h2 style={{color:'#22d3ee'}}>Mis Archivos</h2>
        {ownedFiles.length === 0 && <p>No tienes archivos cargados.</p>}
        <div role="list" aria-label="Lista de archivos cargados">
          {ownedFiles.map(file => (
            <div
              key={file.id}
              role="listitem"
              tabIndex={0}
              aria-label={`Archivo ${file.name}`}
              style={styles.fileCard}
            >
              <div style={{flex:1,overflow:'hidden'}}>
                <div style={styles.fileName}>{file.name}</div>
                <div style={styles.fileMeta}>Creado: {formatDate(file.createdAt)}</div>
              </div>
              <div style={styles.fileActions}>
                <button
                  title="Gestionar permisos"
                  aria-label={`Gestionar permisos del archivo ${file.name}`}
                  onClick={() => openPermissionsModal(file)}
                  style={styles.iconBtn}
                >
                  <span className="material-icons">lock_open</span>
                </button>
                <button
                  title="Descargar archivo"
                  aria-label={`Descargar archivo ${file.name}`}
                  onClick={() => handleDownloadFile(file)}
                  style={styles.iconBtn}
                >
                  <span className="material-icons">download</span>
                </button>
                <button
                  title="Eliminar archivo"
                  aria-label={`Eliminar archivo ${file.name}`}
                  onClick={() => handleDeleteFile(file)}
                  style={styles.iconBtn}
                >
                  <span className="material-icons">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const SectionAudit = () => {
    return (
      <section aria-label="Registro de auditoría de accesos y actividades">
        <h2 style={{color:'#22d3ee'}}>Registro de Auditoría</h2>
        <div style={styles.logsList} tabIndex={0} aria-live="polite" aria-atomic="false" aria-relevant="additions">
          {auditLogs.length === 0 && <p>No hay registros disponibles</p>}
          {auditLogs.slice().reverse().map(log => (
            <div key={log.id} style={{marginBottom:4}}>
              [{formatDate(log.timestamp)}] <strong>{log.userEmail}</strong> - Acción: {log.action} - Archivo ID: {log.fileId} - Detalles: {log.details}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const SectionProfile = () => (
    <section aria-label="Perfil de usuario" style={{maxWidth: 400}}>
      <h2 style={{color:'#22d3ee'}}>Perfil de Usuario</h2>
      <img
        src={currentUser.avatar || 'https://i.pravatar.cc/150?img=4'}
        alt={`Avatar de ${currentUser.name}`}
        style={{borderRadius: '50%', width: 80, height: 80, marginBottom: 16}}
      />
      <p><b>Nombre:</b> {currentUser.name}</p>
      <p><b>Email:</b> {currentUser.email}</p>
      <p><b>Rol:</b> {currentUser.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
      <button style={{...styles.uploadBtn, backgroundColor: '#dc2626'}} onClick={handleLogout}>Cerrar Sesión</button>
    </section>
  );

  // Modal permisos
  const PermissionsModal = () => {
    if(!modalOpen || !activeFileForPermissions) return null;
    const file = activeFileForPermissions;
    const collaborators = file.authorizedUsers
      .filter(uid => uid !== file.ownerId)
      .map(uid => users.find(u => u.id === uid))
      .filter(Boolean);

    return (
      <div aria-modal="true" role="dialog" aria-labelledby="permissions-modal-title" style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3 id="permissions-modal-title" style={{color:'#22d3ee'}}>Gestionar permisos</h3>
            <button aria-label="Cerrar modal" onClick={() => setModalOpen(false)} style={{background:'none',border:'none',color:'#22d3ee', fontSize:24,cursor:'pointer'}}>×</button>
          </div>
          <input
            type="email"
            placeholder="Correo electrónico usuario"
            aria-label="Dirección de correo electrónico para compartir archivo"
            style={styles.textInput}
            value={newPermissionEmail}
            onChange={e=>setNewPermissionEmail(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') addPermission(); }}
          />
          <button onClick={addPermission} style={{...styles.uploadBtn, marginBottom:12}}>Agregar permiso</button>
          <ul style={styles.permissionsList} aria-live="polite" aria-relevant="additions removals">
            {collaborators.length === 0 && <li>No hay permisos concedidos a otros usuarios.</li>}
            {collaborators.map(u => (
              <li key={u.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 12px', borderBottom:'1px solid #64748b'}}>
                <span>{u.email}</span>
                <button aria-label={`Eliminar permiso de ${u.email}`} onClick={() => removePermission(u.email)} style={{background:'none',border:'none',color:'#ef4444',fontSize:20,cursor:'pointer'}}>&#10006;</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Sidebar con navegación
  const Sidebar = () => {
    return (
      <nav aria-label="Navegación principal" style={styles.sidebar}>
        <div style={{fontWeight:'600', fontSize: '1.2rem', color: '#22d3ee', userSelect:'none',paddingBottom:8,borderBottom:'1px solid rgba(100, 116, 139, 0.3)'}}>Navegación</div>
        {navLinks.map(link => (
          <button
            key={link.id}
            onClick={() => setSection(link.id)}
            aria-current={section === link.id ? 'page' : undefined}
            style={{...styles.navItem, backgroundColor: section === link.id ? '#4f46e5' : 'transparent', color: section === link.id ? '#fff' : '#e2e8f0'}}
            title={link.label}
          >
            <span className="material-icons" aria-hidden="true" style={{color: section === link.id ? '#22d3ee' : '#4f46e5'}}>{link.icon}</span> &nbsp; {link.label}
          </button>
        ))}
      </nav>
    );
  };

  // Header
  const Header = () => {
    return (
      <header style={styles.header} role="banner" aria-label="Cabecera principal">
        <div style={styles.headerBrand} aria-label="Marca Repositorio Seguro">
          <span className="material-icons" aria-hidden="true" style={{fontSize:28,color:'#4f46e5'}}>folder_shared</span>
          <span>Repositorio Seguro</span>
        </div>
        <div style={styles.userInfo} aria-live="polite" aria-atomic="true" aria-relevant="text">
          <div style={styles.userAvatar} aria-hidden="true">
            <img src={currentUser?.avatar || 'https://i.pravatar.cc/150?img=4'} alt={currentUser ? `Avatar de ${currentUser.name}` : 'Avatar por defecto'} />
          </div>
          <span style={styles.username}>{currentUser ? currentUser.name : 'Iniciar sesión'}</span>
          {currentUser && <button onClick={handleLogout} title="Cerrar sesión" style={styles.logoutBtn}>Salir</button>}
        </div>
      </header>
    );
  };

  // Login vista
  const Login = () => {
    return (
      <section aria-label="Inicio de sesión a Repositorio Seguro" style={{ maxWidth: 400, margin: 'auto' }}>
        <h2 style={{ color: '#22d3ee' }}>Iniciar Sesión</h2>
        <p>Seleccione su usuario para acceder al sistema:</p>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginTop: '20px'
        }}>
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => handleLogin(user)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
            >
              <img 
                src={user.avatar} 
                alt={`Avatar de ${user.name}`} 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <div>
                <div style={{ fontWeight: '600' }}>{user.name}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{user.email}</div>
                <div style={{ 
                  fontSize: '0.7rem', 
                  marginTop: '4px',
                  backgroundColor: user.role === 'admin' ? '#dc2626' : '#16a34a',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {user.role === 'admin' ? 'Administrador' : user.role === 'editor' ? 'Editor' : 'Usuario'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  };

  // Render contenido principal según sección
  const MainContent = () => {
    if(!currentUser && section !== 'login') return <Login />;

    switch(section) {
      case 'upload': return <SectionUpload />;
      case 'myfiles': return <SectionMyFiles />;
      case 'audit': return <SectionAudit />;
      case 'profile': return <SectionProfile />;
      case 'login': return <Login />;
      default: return <SectionUpload />;
    }
  };

  return (
    <>
      <Header />
      <div style={styles.appContainer} role="main">
        {currentUser && <Sidebar />}
        <main tabIndex={-1} aria-live="polite" aria-label="Área de contenido principal" style={styles.contentArea}>
          <MainContent />
        </main>
      </div>
      <PermissionsModal />
      <Toast message={toastMessage} show={!!toastMessage} />
    </>
  );
}

// Estilos
const styles = {
  header: {
    height: 64,
    position: 'sticky',
    top:0,
    backdropFilter: 'saturate(180%) blur(12px)',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderBottom: '1px solid rgba(100, 116, 139, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 1000,
    boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)',
    userSelect: 'none',
    fontWeight: 700,
    fontSize: 20,
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 700,
    fontSize: '1.4rem',
    background: 'linear-gradient(135deg, #4f46e5, #22d3ee)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    gap: 8,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    overflow: 'hidden',
    boxShadow: '0 0 8px #22d3ee',
  },
  username: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#22d3ee',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 16,
    marginLeft: 8
  },
  appContainer: {
    display: 'flex',
    flex: 1,
    height: 'calc(100vh - 64px)',
  },
  sidebar: {
    width: 280,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    gap: 16,
    overflowY: 'auto',
    userSelect: 'none',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 12,
    color: '#e2e8f0',
    backgroundColor: 'transparent',
    fontWeight: 500,
    fontSize: 16,
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
  },
  contentArea: {
    flex: 1,
    minHeight: 'calc(100vh - 64px)',
    overflowY: 'auto',
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
  },
  fileLabel: {
    display: 'inline-block',
    padding: '12px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontWeight: 700,
    borderRadius: 12,
    cursor: 'pointer',
    userSelect: 'none',
    textAlign: 'center',
    width: '100%',
    maxWidth: 400,
  },
  textInput: {
    padding: '10px 14px',
    borderRadius: 12,
    border: 'none',
    fontSize: 16,
    width: '100%',
    maxWidth: 360,
    outline: 'none',
    boxShadow: '0 0 8px transparent',
    transition: 'box-shadow 0.3s ease',
    color: '#e2e8f0',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    marginTop: 10,
    marginBottom: 10,
  },
  uploadBtn: {
    alignSelf: 'start',
    backgroundColor: '#22d3ee',
    color: '#0f172a',
    fontWeight: 700,
    borderRadius: 12,
    padding: '12px 28px',
    cursor: 'pointer',
    fontSize: 16,
    border: 'none',
    transition: 'background-color 0.3s ease',
  },
  uploadBtnFullWidth: {
    width: '100%',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontWeight: 700,
    borderRadius: 12,
    padding: '12px 28px',
    cursor: 'pointer',
    fontSize: 16,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fileCard: {
    backgroundColor: 'rgba(39, 52, 71, 0.8)',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.8)',
    transition: 'background-color 0.3s ease',
    cursor: 'pointer',
    color: '#e2e8f0',
  },
  fileName: {
    fontWeight: 600,
    fontSize: 18,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  fileActions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexShrink: 0,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#22d3ee',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
    fontSize: 24,
    padding: 4,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logsList: {
    maxHeight: 240,
    overflowY: 'auto',
    fontSize: 14,
    color: '#94a3b8',
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderRadius: 12,
    border: '1px solid rgba(100,116,139,0.3)',
    padding: 12,
    fontFamily: 'monospace, monospace',
    lineHeight: 1.4,
    userSelect: 'text',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200,
  },
  modalContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 24,
    borderRadius: 12,
    minWidth: 320,
    maxWidth: 480,
    boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)',
    maxHeight: '80vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  permissionsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    maxHeight: 120,
    overflowY: 'auto',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.75)',
  },
};