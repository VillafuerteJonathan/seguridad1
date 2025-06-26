import React from 'react';

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

export default Toast;
