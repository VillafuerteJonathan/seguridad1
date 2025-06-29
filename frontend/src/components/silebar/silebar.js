import React from 'react';

const Sidebar = ({ filesCount = 0, onNavigate }) => {
  // onNavigate es una función callback para cambiar sección, ejemplo: (section) => {}
  // Puedes manejar la selección activa con estado en el componente padre o usar React Router si quieres.

  // Estado local para controlar qué sección está activa
  const [activeSection, setActiveSection] = React.useState('upload');

  const handleClick = (section) => {
    setActiveSection(section);
    if (onNavigate) onNavigate(section);
  };

  return (
    <nav className="sidebar" aria-label="Navegación principal" id="sidebar">
      <div className="sidebar-header">Navegación</div>

      <a
        href="#upload"
        className={`nav-item ${activeSection === 'upload' ? 'active' : ''}`}
        data-section="upload"
        tabIndex={0}
        onClick={e => {
          e.preventDefault();
          handleClick('upload');
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick('upload');
          }
        }}
        aria-current={activeSection === 'upload' ? 'page' : undefined}
      >
        <span className="material-icons" aria-hidden="true">upload_file</span>
        <span>Cargar Archivos</span>
      </a>

      <a
        href="#myfiles"
        className={`nav-item ${activeSection === 'myfiles' ? 'active' : ''}`}
        data-section="myfiles"
        tabIndex={0}
        onClick={e => {
          e.preventDefault();
          handleClick('myfiles');
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick('myfiles');
          }
        }}
        aria-current={activeSection === 'myfiles' ? 'page' : undefined}
      >
        <span className="material-icons" aria-hidden="true">folder</span>
        <span>Mis Archivos</span>
        {filesCount > 0 && (
          <span
            id="userFilesCount"
            className="notification-badge"
            aria-label={`Cantidad de archivos del usuario: ${filesCount}`}
          >
            {filesCount}
          </span>
        )}
      </a>

      <a
        href="#shared"
        className={`nav-item ${activeSection === 'shared' ? 'active' : ''}`}
        data-section="shared"
        tabIndex={0}
        onClick={e => { e.preventDefault(); handleClick('shared') }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault(); handleClick('shared')
          }
        }}
        aria-current={activeSection === 'shared' ? 'page' : undefined}
      >
        <span className="material-icons" aria-hidden="true">share</span>
        <span>Archivos Compartidos</span>
      </a>

      <a
        href="#audit"
        className={`nav-item ${activeSection === 'audit' ? 'active' : ''}`}
        data-section="audit"
        tabIndex={0}
        onClick={e => {
          e.preventDefault();
          handleClick('audit');
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick('audit');
          }
        }}
        aria-current={activeSection === 'audit' ? 'page' : undefined}
      >
        <span className="material-icons" aria-hidden="true">fact_check</span>
        <span>Auditoría</span>
      </a>

      <a
        href="#profile"
        className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
        data-section="profile"
        tabIndex={0}
        onClick={e => {
          e.preventDefault();
          handleClick('profile');
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick('profile');
          }
        }}
        aria-current={activeSection === 'profile' ? 'page' : undefined}
      >
        <span className="material-icons" aria-hidden="true">person</span>
        <span>Perfil</span>
      </a>
    </nav>
  );
};

export default Sidebar;
