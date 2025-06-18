import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Registro';
import Dashboard from './pages/Dashboard';
import Verificacion from './pages/dFA';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';



function App() {
  return (
    <Router>
    <Routes>
    <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Dashboard />} />
      <Route path="/dFA" element={<Verificacion/>} />
    </Routes>
  </Router>
    
  );
}


export default App;
