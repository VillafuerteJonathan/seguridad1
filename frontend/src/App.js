import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Login from './componentes/Login';
import Register from './componentes/Registro';
import Dashboard from './componentes/Dashboard';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';



function App() {
  return (
    <Router>
    <Routes>
    <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Dashboard />} />
    </Routes>
  </Router>
    
  );
}


export default App;
